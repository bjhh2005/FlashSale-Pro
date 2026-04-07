package com.flashsale.flashsale_pro.security;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Date;

@Service
public class JwtService {

    @Value("${jwt.secret}")
    private String jwtSecret;

    @Value("${jwt.expire-seconds}")
    private long jwtExpireSeconds;

    public String createToken(Long userId, String username) {
        Instant now = Instant.now();
        Instant expireAt = now.plusSeconds(jwtExpireSeconds);
        return Jwts.builder()
                .subject(String.valueOf(userId))
                .claim("username", username)
                .issuedAt(Date.from(now))
                .expiration(Date.from(expireAt))
                .signWith(resolveSecretKey())
                .compact();
    }

    public Claims parseToken(String token) {
        return Jwts.parser()
                .verifyWith(resolveSecretKey())
                .build()
                .parseSignedClaims(token)
                .getPayload();
    }

    public boolean isExpired(Claims claims) {
        Date expiration = claims.getExpiration();
        return expiration == null || expiration.before(new Date());
    }

    public long getJwtExpireSeconds() {
        return jwtExpireSeconds;
    }

    private SecretKey resolveSecretKey() {
        byte[] raw = jwtSecret.getBytes(StandardCharsets.UTF_8);
        if (raw.length >= 32) {
            return Keys.hmacShaKeyFor(raw);
        }
        return Keys.hmacShaKeyFor(Decoders.BASE64.decode(jwtSecret));
    }
}
