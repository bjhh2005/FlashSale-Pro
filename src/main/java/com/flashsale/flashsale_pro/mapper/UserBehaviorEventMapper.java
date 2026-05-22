package com.flashsale.flashsale_pro.mapper;

import com.flashsale.flashsale_pro.entity.UserBehaviorEvent;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface UserBehaviorEventMapper {

    @Insert("INSERT INTO user_behavior_event(user_id, product_id, event_id, item_id, action, dwell_seconds, extra) " +
            "VALUES(#{userId}, #{productId}, #{eventId}, #{itemId}, #{action}, #{dwellSeconds}, " +
            "#{extra, jdbcType=VARCHAR}::jsonb)")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(UserBehaviorEvent event);

    @Select("SELECT * FROM user_behavior_event WHERE user_id = #{userId} ORDER BY created_at DESC LIMIT #{limit}")
    List<UserBehaviorEvent> findByUserId(@Param("userId") Long userId, @Param("limit") int limit);

    @Select("SELECT * FROM user_behavior_event WHERE user_id = #{userId} AND action = #{action} ORDER BY created_at DESC LIMIT #{limit}")
    List<UserBehaviorEvent> findByUserIdAndAction(@Param("userId") Long userId, @Param("action") String action, @Param("limit") int limit);

    @Select("SELECT COUNT(*) FROM user_behavior_event WHERE user_id = #{userId} AND created_at >= NOW() - INTERVAL '${days} days'")
    int countRecentActions(@Param("userId") Long userId, @Param("days") int days);
}
