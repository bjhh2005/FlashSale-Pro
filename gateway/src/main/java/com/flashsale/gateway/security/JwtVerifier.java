package com.flashsale.gateway.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Component
public class JwtVerifier {

    @Value("${jwt.secret}")
    private String jwtSecret;

    public Claims parseAndValidate(String token) {
        Claims claims = Jwts.parser()
                .verifyWith(resolveSecretKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
        Date expiration = claims.getExpiration();
        if (expiration == null || expiration.before(new Date())) {
            throw new IllegalArgumentException("Token 已过期");
        }
        return claims;
    }

    private SecretKey resolveSecretKey() {
        byte[] raw = jwtSecret.getBytes(StandardCharsets.UTF_8);
        return Keys.hmacShaKeyFor(raw);
    }
}
