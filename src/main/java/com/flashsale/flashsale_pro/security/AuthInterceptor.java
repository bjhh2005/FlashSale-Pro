package com.flashsale.flashsale_pro.security;

import com.flashsale.flashsale_pro.common.Result;
import io.jsonwebtoken.Claims;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

import java.nio.charset.StandardCharsets;

@Component
public class AuthInterceptor implements HandlerInterceptor {

    private final JwtService jwtService;

    public AuthInterceptor(JwtService jwtService) {
        this.jwtService = jwtService;
    }

    @Override
    public boolean preHandle(HttpServletRequest request, HttpServletResponse response, Object handler) throws Exception {
        String header = request.getHeader("Authorization");
        if (header == null || !header.startsWith("Bearer ")) {
            writeUnauthorized(response, "未携带有效的 Bearer Token");
            return false;
        }
        String token = header.substring("Bearer ".length()).trim();
        if (token.isEmpty()) {
            writeUnauthorized(response, "未携带有效的 Bearer Token");
            return false;
        }
        try {
            Claims claims = jwtService.parseToken(token);
            if (jwtService.isExpired(claims)) {
                writeUnauthorized(response, "Token 已过期");
                return false;
            }
            request.setAttribute("authUserId", Long.valueOf(claims.getSubject()));
            request.setAttribute("authUsername", String.valueOf(claims.get("username")));
            return true;
        } catch (Exception ex) {
            writeUnauthorized(response, "Token 无效");
            return false;
        }
    }

    private void writeUnauthorized(HttpServletResponse response, String message) throws Exception {
        response.setStatus(HttpStatus.UNAUTHORIZED.value());
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setCharacterEncoding(StandardCharsets.UTF_8.name());
        response.getWriter().write("{\"code\":401,\"message\":\"" + message + "\",\"data\":null}");
    }
}
