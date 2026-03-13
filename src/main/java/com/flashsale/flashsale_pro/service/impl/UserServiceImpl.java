package com.flashsale.flashsale_pro.service.impl;

import com.flashsale.flashsale_pro.entity.User;
import com.flashsale.flashsale_pro.mapper.UserMapper;
import com.flashsale.flashsale_pro.service.UserService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import java.util.UUID;

@Service
public class UserServiceImpl implements UserService {

    @Autowired
    private UserMapper userMapper;

    @Override
    public String login(String username, String password) {
        // 1. 查询数据库中是否存在该用户
        User user = userMapper.findByUsername(username);
        
        // 2. 校验用户是否存在并且密码是否匹配（真实项目中需要对密码进行加密处理，比如MD5或BCrypt加密）
        if (user != null && user.getPassword().equals(password)) {
            // 3. 登录成功，生成一个简单的Token返回给前端 (暂时使用UUID模拟Token)
            // 后续可以引入JWT（JSON Web Token）或将Token存入Redis
            String token = UUID.randomUUID().toString().replace("-", "");
            return token;
        }
        
        // 登录失败返回null或者抛出自定义异常
        return null;
    }

    @Override
    public boolean register(User user) {
        // 实际开发中应该先验证用户名是否已存在，然后再插入
        User existUser = userMapper.findByUsername(user.getUsername());
        if (existUser != null) {
            return false;
        }
        // 插入数据库
        int result = userMapper.insertUser(user);
        return result > 0;
    }
}
