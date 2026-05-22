package com.flashsale.gateway.filter;

import com.flashsale.gateway.entropy.ShannonConditionalEntropy;
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
import java.util.concurrent.atomic.AtomicLong;

@Component
public class EntropyTrafficFilter implements GlobalFilter, Ordered {

    private static final Logger log = LoggerFactory.getLogger(EntropyTrafficFilter.class);

    private static final String MATRIX_KEY_PREFIX = "flashsale:bi:matrix:";
    private static final String[] STATES = ShannonConditionalEntropy.getStates();
    private static final int N = STATES.length;

    private static final List<String> ENTROPY_CHECK_PATHS = List.of(
            "/api/flash-sale/order"
    );

    private static final List<String> BYPASS_PATHS = List.of(
            "/api/user/login", "/api/user/register",
            "/api/behavior", "/actuator"
    );

    private final ReactiveStringRedisTemplate redisTemplate;

    private final AtomicLong totalRequests = new AtomicLong(0);
    private final AtomicLong greenCount = new AtomicLong(0);
    private final AtomicLong yellowCount = new AtomicLong(0);
    private final AtomicLong blackCount = new AtomicLong(0);
    private final AtomicLong entropyFallback = new AtomicLong(0);

    public EntropyTrafficFilter(ReactiveStringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String path = exchange.getRequest().getURI().getPath();

        for (String bypass : BYPASS_PATHS) {
            if (path.startsWith(bypass)) return chain.filter(exchange);
        }

        boolean needsCheck = false;
        for (String p : ENTROPY_CHECK_PATHS) {
            if (path.startsWith(p)) { needsCheck = true; break; }
        }
        if (!needsCheck) return chain.filter(exchange);

        totalRequests.incrementAndGet();

        String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");
        if (userId == null || userId.isBlank()) return chain.filter(exchange);

        return loadMatrix(userId)
                .timeout(Duration.ofMillis(10))
                .onErrorResume(ex -> {
                    log.debug("Entropy matrix load failed for user {}: {}", userId, ex.getMessage());
                    entropyFallback.incrementAndGet();
                    return Mono.just(new int[N][N]);
                })
                .flatMap(matrix -> {
                    double entropy = ShannonConditionalEntropy.compute(matrix);
                    String color = ShannonConditionalEntropy.classify(entropy);

                    switch (color) {
                        case "GREEN" -> greenCount.incrementAndGet();
                        case "YELLOW" -> yellowCount.incrementAndGet();
                        case "BLACK" -> blackCount.incrementAndGet();
                    }

                    ServerHttpRequest mutated = exchange.getRequest().mutate()
                            .header("X-Traffic-Color", color)
                            .header("X-Entropy-Value", String.format("%.4f", entropy))
                            .build();

                    if ("BLACK".equals(color)) {
                        return delayedHoneypot(exchange.mutate().request(mutated).build(), chain);
                    }

                    return chain.filter(exchange.mutate().request(mutated).build());
                });
    }

    private Mono<int[][]> loadMatrix(String userId) {
        java.util.List<String> keys = new java.util.ArrayList<>(N * N);
        for (int i = 0; i < N; i++) {
            for (int j = 0; j < N; j++) {
                keys.add(MATRIX_KEY_PREFIX + userId + ":" + STATES[i] + ":" + STATES[j]);
            }
        }

        return redisTemplate.opsForValue().multiGet(keys)
                .map(values -> {
                    int[][] matrix = new int[N][N];
                    for (int k = 0; k < values.size() && k < N * N; k++) {
                        String val = values.get(k);
                        matrix[k / N][k % N] = (val != null) ? Integer.parseInt(val) : 0;
                    }
                    return matrix;
                })
                .defaultIfEmpty(new int[N][N]);
    }

    private Mono<Void> delayedHoneypot(ServerWebExchange exchange, GatewayFilterChain chain) {
        return Mono.delay(Duration.ofMillis(500 + (long)(Math.random() * 1500)))
                .then(chain.filter(exchange));
    }

    public java.util.Map<String, Long> getStats() {
        return java.util.Map.of(
                "totalRequests", totalRequests.get(),
                "green", greenCount.get(),
                "yellow", yellowCount.get(),
                "black", blackCount.get(),
                "fallback", entropyFallback.get()
        );
    }

    @Override
    public int getOrder() {
        return -2;
    }
}
