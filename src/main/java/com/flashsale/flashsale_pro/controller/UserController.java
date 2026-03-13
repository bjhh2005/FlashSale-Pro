package com.flashsale.flashsale_pro.controller;

import com.flashsale.flashsale_pro.common.Result;
import com.flashsale.flashsale_pro.entity.User;
import com.flashsale.flashsale_pro.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @Autowired
    private UserService userService;

    // 登录接口 (使用POST防止密码出现在URL中)
    // 假设前端发送的JSON如：{"username": "admin", "password": "123"}
    @PostMapping("/login")
    public Result<String> login(@RequestBody User user) {
        String token = userService.login(user.getUsername(), user.getPassword());
        
        if (token != null) {
            // 返回成功和生成的Token
            return Result.success(token);
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
}
