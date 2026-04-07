package com.flashsale.gateway.filter;

import com.flashsale.gateway.security.JwtVerifier;
import io.jsonwebtoken.Claims;
import org.springframework.cloud.gateway.filter.GatewayFilterChain;
import org.springframework.cloud.gateway.filter.GlobalFilter;
import org.springframework.core.Ordered;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.server.reactive.ServerHttpRequest;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ServerWebExchange;
import reactor.core.publisher.Mono;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

@Component
public class AuthGlobalFilter implements GlobalFilter, Ordered {

    private static final List<String> WHITE_LIST = List.of(
            "/api/user/login",
            "/api/user/register",
            "/actuator/health"
    );

    private final JwtVerifier jwtVerifier;

    public AuthGlobalFilter(JwtVerifier jwtVerifier) {
        this.jwtVerifier = jwtVerifier;
    }

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        String incomingTraceId = exchange.getRequest().getHeaders().getFirst("X-Trace-Id");
        String traceId = (incomingTraceId == null || incomingTraceId.isBlank())
                ? UUID.randomUUID().toString().replace("-", "")
                : incomingTraceId;

        ServerHttpRequest tracedRequest = exchange.getRequest().mutate()
                .header("X-Trace-Id", traceId)
                .build();
        ServerWebExchange tracedExchange = exchange.mutate().request(tracedRequest).build();
        tracedExchange.getResponse().getHeaders().set("X-Trace-Id", traceId);

        String path = tracedExchange.getRequest().getURI().getPath();
        for (String white : WHITE_LIST) {
            if (path.startsWith(white)) {
                return chain.filter(tracedExchange);
            }
        }

        String auth = tracedExchange.getRequest().getHeaders().getFirst("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            return unauthorized(tracedExchange, "未携带有效的 Bearer Token");
        }

        String token = auth.substring("Bearer ".length()).trim();
        if (token.isEmpty()) {
            return unauthorized(tracedExchange, "未携带有效的 Bearer Token");
        }

        try {
            Claims claims = jwtVerifier.parseAndValidate(token);
            ServerHttpRequest mutated = tracedExchange.getRequest().mutate()
                    .header("X-User-Id", claims.getSubject())
                    .header("X-Username", String.valueOf(claims.get("username")))
                    .header("X-Trace-Id", traceId)
                    .build();
            ServerWebExchange authExchange = tracedExchange.mutate().request(mutated).build();
            authExchange.getResponse().getHeaders().set("X-Trace-Id", traceId);
            return chain.filter(authExchange);
        } catch (Exception ex) {
            return unauthorized(tracedExchange, "Token 无效");
        }
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange, String message) {
        exchange.getResponse().setStatusCode(HttpStatus.UNAUTHORIZED);
        exchange.getResponse().getHeaders().setContentType(MediaType.APPLICATION_JSON);
        byte[] body = ("{\"code\":401,\"message\":\"" + message + "\",\"data\":null}")
                .getBytes(StandardCharsets.UTF_8);
        return exchange.getResponse().writeWith(Mono.just(exchange.getResponse().bufferFactory().wrap(body)));
    }

    @Override
    public int getOrder() {
        return 0;
    }
}
