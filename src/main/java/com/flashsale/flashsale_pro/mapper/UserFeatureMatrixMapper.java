package com.flashsale.flashsale_pro.mapper;

import com.flashsale.flashsale_pro.entity.UserFeatureMatrix;
import org.apache.ibatis.annotations.*;

@Mapper
public interface UserFeatureMatrixMapper {

    @Select("SELECT * FROM user_feature_matrix WHERE user_id = #{userId}")
    UserFeatureMatrix findByUserId(@Param("userId") Long userId);

    @Select("SELECT * FROM user_feature_matrix WHERE user_id = #{userId} AND event_id = #{eventId}")
    UserFeatureMatrix findByUserIdAndEventId(@Param("userId") Long userId, @Param("eventId") Long eventId);

    @Insert("INSERT INTO user_feature_matrix(user_id, event_id, click_count, favorite_count, add_to_cart_count, " +
            "browse_count, share_count, purchase_count, avg_dwell_seconds, recent_7d_action_count, " +
            "recent_1d_action_count, action_decay_score, cross_product_count, price_sensitivity, " +
            "purchase_intent_score, intent_score_updated_at) " +
            "VALUES(#{userId}, #{eventId}, #{clickCount}, #{favoriteCount}, #{addToCartCount}, " +
            "#{browseCount}, #{shareCount}, #{purchaseCount}, #{avgDwellSeconds}, #{recent7dActionCount}, " +
            "#{recent1dActionCount}, #{actionDecayScore}, #{crossProductCount}, #{priceSensitivity}, " +
            "#{purchaseIntentScore}, #{intentScoreUpdatedAt})")
    @Options(useGeneratedKeys = true, keyProperty = "id")
    void insert(UserFeatureMatrix matrix);

    @Update("UPDATE user_feature_matrix SET click_count=#{clickCount}, favorite_count=#{favoriteCount}, " +
            "add_to_cart_count=#{addToCartCount}, browse_count=#{browseCount}, share_count=#{shareCount}, " +
            "purchase_count=#{purchaseCount}, avg_dwell_seconds=#{avgDwellSeconds}, " +
            "recent_7d_action_count=#{recent7dActionCount}, recent_1d_action_count=#{recent1dActionCount}, " +
            "action_decay_score=#{actionDecayScore}, cross_product_count=#{crossProductCount}, " +
            "price_sensitivity=#{priceSensitivity}, purchase_intent_score=#{purchaseIntentScore}, " +
            "intent_score_updated_at=#{intentScoreUpdatedAt}, updated_at=NOW() WHERE user_id=#{userId}")
    void update(UserFeatureMatrix matrix);

    @Update("UPDATE user_feature_matrix SET purchase_intent_score=#{score}, intent_score_updated_at=NOW(), updated_at=NOW() WHERE user_id=#{userId}")
    void updateIntentScore(@Param("userId") Long userId, @Param("score") java.math.BigDecimal score);
}
