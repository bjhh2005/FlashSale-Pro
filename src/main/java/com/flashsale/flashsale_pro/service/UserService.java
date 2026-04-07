package com.flashsale.flashsale_pro.service;

import com.flashsale.flashsale_pro.entity.User;

public interface UserService {
    // 处理登录请求
    User login(String username, String password);

    // 注册新用户
    boolean register(User user);
}
