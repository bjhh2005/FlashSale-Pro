package com.flashsale.flashsale_pro.mapper;

import com.flashsale.flashsale_pro.entity.User;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Insert;

@Mapper
public interface UserMapper {

    // 根据用户名查询用户
    @Select("SELECT id, username, password FROM \"user\" WHERE username = #{username}")
    User findByUsername(@Param("username") String username);

    // 插入新用户
    @Insert("INSERT INTO \"user\" (username, password) VALUES (#{username}, #{password})")
    int insertUser(User user);
}
