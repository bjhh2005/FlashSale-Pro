package com.flashsale.gateway.filter;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Component
public class IntentFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(IntentFilter.class);

    private static final List<String> INTENT_FILTER_PATHS = List.of(
            "/api/flash-sale/order"
    );

    private static final List<String> BYPASS_PATHS = List.of(
            "/api/user/login",
            "/api/user/register",
            "/api/behavior",
            "/actuator"
    );

    private final ReactiveStringRedisTemplate redisTemplate;

    private final String scoreKeyPrefix;
    private final String tierKeyPrefix;
    private final double highThreshold;
    private final double lowThreshold;
    private final boolean enabled;
    private final boolean degradeToTokenBucket;
    private final long tokenBucketCapacity;
    private final long tokenBucketRefillRate;

    private final AtomicLong tokenBucketTokens;
    private final AtomicLong lastRefillTime;
    private final Map<String, AtomicLong> userTokenBuckets = new ConcurrentHashMap<>();

    private final AtomicLong totalRequests = new AtomicLong(0);
    private final AtomicLong highIntentCount = new AtomicLong(0);
    private final AtomicLong mediumIntentCount = new AtomicLong(0);
    private final AtomicLong lowIntentBlocked = new AtomicLong(0);
    private final AtomicLong degradedCount = new AtomicLong(0);

    public IntentFilter(ReactiveStringRedisTemplate redisTemplate,
                        org.springframework.core.env.Environment env) {
        this.redisTemplate = redisTemplate;
        this.scoreKeyPrefix = env.getProperty("intent.score-key-prefix", "intent:score:");
        this.tierKeyPrefix = env.getProperty("intent.tier-key-prefix", "intent:tier:");
        this.highThreshold = Double.parseDouble(env.getProperty("intent.high-threshold", "0.7"));
        this.lowThreshold = Double.parseDouble(env.getProperty("intent.low-threshold", "0.3"));
        this.enabled = Boolean.parseBoolean(env.getProperty("intent.enabled", "true"));
        this.degradeToTokenBucket = Boolean.parseBoolean(env.getProperty("intent.degrade-to-token-bucket", "true"));
        this.tokenBucketCapacity = Long.parseLong(env.getProperty("intent.token-bucket-capacity", "1000"));
        this.tokenBucketRefillRate = Long.parseLong(env.getProperty("intent.token-bucket-refill-rate", "100"));
        this.tokenBucketTokens = new AtomicLong(this.tokenBucketCapacity);
        this.lastRefillTime = new AtomicLong(System.currentTimeMillis());
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        if (!enabled) {
            return chain.filter(exchange);
        }

        String path = exchange.getRequest().getURI().getPath();

        for (String bypass : BYPASS_PATHS) {
            if (path.startsWith(bypass)) {
                return chain.filter(exchange);
            }
        }

        boolean needsIntentCheck = false;
        for (String intentPath : INTENT_FILTER_PATHS) {
            if (path.startsWith(intentPath)) {
                needsIntentCheck = true;
                break;
            }
        }

        if (!needsIntentCheck) {
            return chain.filter(exchange);
        }

        totalRequests.incrementAndGet();

        String userIdHeader = exchange.getRequest().getHeaders().getFirst("X-User-Id");
        if (userIdHeader == null || userIdHeader.isBlank()) {
            return chain.filter(exchange);
        }

        String userId = userIdHeader;

        return redisTemplate.opsForValue().get(tierKeyPrefix + userId)
                .timeout(Duration.ofMillis(5))
                .onErrorResume(ex -> {
                    log.warn("Redis intent lookup failed, degrading to token bucket: {}", ex.getMessage());
                    degradedCount.incrementAndGet();
                    if (degradeToTokenBucket) {
                        return Mono.just(checkTokenBucket() ? "MEDIUM" : "LOW");
                    }
                    return Mono.just("MEDIUM");
                })
                .flatMap(tier -> {
                    switch (tier) {
                        case "HIGH" -> {
                            highIntentCount.incrementAndGet();
                            ServerHttpRequest mutated = exchange.getRequest().mutate()
                                    .header("X-Intent-Tier", "HIGH")
                                    .header("X-Intent-Score", "HIGH")
                                    .build();
                            return chain.filter(exchange.mutate().request(mutated).build());
                        }
                        case "MEDIUM" -> {
                            mediumIntentCount.incrementAndGet();
                            ServerHttpRequest mutated = exchange.getRequest().mutate()
                                    .header("X-Intent-Tier", "MEDIUM")
                                    .build();
                            return chain.filter(exchange.mutate().request(mutated).build());
                        }
                        case "LOW" -> {
                            lowIntentBlocked.incrementAndGet();
                            return blockedResponse(exchange, "购买意愿评分过低，请稍后再试");
                        }
                        default -> {
                            return chain.filter(exchange);
                        }
                    }
                })
                .switchIfEmpty(Mono.defer(() -> {
                    degradedCount.incrementAndGet();
                    if (degradeToTokenBucket && !checkTokenBucket()) {
                        lowIntentBlocked.incrementAndGet();
                        return blockedResponse(exchange, "当前访问人数过多，请稍后再试");
                    }
                    mediumIntentCount.incrementAndGet();
                    return chain.filter(exchange);
                }));
    }

    private boolean checkTokenBucket() {
        long now = System.currentTimeMillis();
        long last = lastRefillTime.get();
        long elapsed = now - last;
        if (elapsed > 0 && lastRefillTime.compareAndSet(last, now)) {
            long refill = (elapsed * tokenBucketRefillRate) / 1000;
            long current = tokenBucketTokens.get();
            long newTokens = Math.min(current + refill, tokenBucketCapacity);
            tokenBucketTokens.set(newTokens);
        }
        return tokenBucketTokens.get() > 0 && tokenBucketTokens.decrementAndGet() >= 0;
    }

    private Mono<Void> blockedResponse(ServerWebExchange exchange, String message) {
        exchange.getResponse().setStatusCode(HttpStatus.TOO_MANY_REQUESTS);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        byte[] body = ("{\"code\":429,\"message\":\"" + message + "\",\"data\":null}")
                .getBytes(StandardCharsets.UTF_8);
        return exchange.getResponse().writeWith(
                Mono.just(exchange.getResponse().bufferFactory().wrap(body))
        );
    }

    public Map<String, Long> getStats() {
        return Map.of(
                "totalRequests", totalRequests.get(),
                "highIntent", highIntentCount.get(),
                "mediumIntent", mediumIntentCount.get(),
                "lowBlocked", lowIntentBlocked.get(),
                "degraded", degradedCount.get()
        );
    }

    @Override
    public int getOrder() {
        return -1;
    }
}
