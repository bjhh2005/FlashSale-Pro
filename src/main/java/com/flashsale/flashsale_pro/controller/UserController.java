package com.flashsale.flashsale_pro.controller;

import com.flashsale.flashsale_pro.common.Result;
import com.flashsale.flashsale_pro.entity.User;
import com.flashsale.flashsale_pro.security.JwtService;
import com.flashsale.flashsale_pro.service.UserService;
import io.jsonwebtoken.Claims;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import jakarta.servlet.http.HttpServletRequest;
import java.time.Instant;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

    @Autowired
    private JwtService jwtService;

    // 登录接口 (使用POST防止密码出现在URL中)
    // 假设前端发送的JSON如：{"username": "admin", "password": "123"}
    @PostMapping("/login")
    public Result<Map<String, Object>> login(@RequestBody User user) {
        User loginUser = userService.login(user.getUsername(), user.getPassword());
        
        if (loginUser != null) {
            String token = jwtService.createToken(loginUser.getId(), loginUser.getUsername());
            Map<String, Object> data = new HashMap<>();
            data.put("token", token);
            data.put("userId", loginUser.getId());
            data.put("username", loginUser.getUsername());
            data.put("expireAt", Instant.now().plusSeconds(jwtService.getJwtExpireSeconds()).toString());
            return Result.success(data);
        } else {
            return Result.error(401, "用户名或密码错误");
        }
    }

    // 注册接口
    @PostMapping("/register")
    public Result<String> register(@RequestBody User user) {
        boolean isSuccess = userService.register(user);
        
        if (isSuccess) {
            return Result.success("注册成功！");
        } else {
            return Result.error(400, "用户名已被注册或参数错误");
        }
    }

    @GetMapping("/me")
    public Result<Map<String, Object>> me(HttpServletRequest request) {
        String auth = request.getHeader("Authorization");
        if (auth == null || !auth.startsWith("Bearer ")) {
            return Result.error(401, "未携带有效的 Bearer Token");
        }
        try {
            Claims claims = jwtService.parseToken(auth.substring("Bearer ".length()).trim());
            if (jwtService.isExpired(claims)) {
                return Result.error(401, "Token 已过期");
            }
            Map<String, Object> data = new HashMap<>();
            data.put("userId", Long.valueOf(claims.getSubject()));
            data.put("username", String.valueOf(claims.get("username")));
            data.put("expireAt", claims.getExpiration() == null ? null : claims.getExpiration().toInstant().toString());
            return Result.success(data);
        } catch (Exception ex) {
            return Result.error(401, "Token 无效");
        }
    }
}
