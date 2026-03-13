package com.flashsale.flashsale_pro.mapper;

import com.flashsale.flashsale_pro.entity.FlashSaleOrder;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface FlashSaleOrderMapper {

    @Insert("""
            INSERT INTO flash_sale_order (
                user_id, event_id, item_id, product_id,
                quantity, order_status, total_amount
            ) VALUES (
                #{userId}, #{eventId}, #{itemId}, #{productId},
                #{quantity}, #{orderStatus}, #{totalAmount}
            )
            RETURNING id
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    Long insert(FlashSaleOrder order);

    @Select("""
            SELECT id, user_id, event_id, item_id, product_id,
                   quantity, order_status, total_amount,
                   created_at, paid_at
            FROM flash_sale_order
            WHERE id = #{id}
            """)
    FlashSaleOrder findById(@Param("id") Long id);

    @Select("""
            SELECT id, user_id, event_id, item_id, product_id,
                   quantity, order_status, total_amount,
                   created_at, paid_at
            FROM flash_sale_order
            WHERE user_id = #{userId}
            ORDER BY created_at DESC
            """)
    List<FlashSaleOrder> findByUserId(@Param("userId") Long userId);

    @Select("""
            SELECT id, user_id, event_id, item_id, product_id,
                   quantity, order_status, total_amount,
                   created_at, paid_at
            FROM flash_sale_order
            WHERE user_id = #{userId} AND item_id = #{itemId}
            """)
    FlashSaleOrder findByUserAndItem(@Param("userId") Long userId, @Param("itemId") Long itemId);

    @Update("""
            UPDATE flash_sale_order
            SET order_status = #{orderStatus},
                paid_at = #{paidAt}
            WHERE id = #{id}
            """)
    int updateStatus(FlashSaleOrder order);

    @Update("""
            UPDATE flash_sale_order
            SET order_status = 'PAID',
                paid_at = NOW()
            WHERE id = #{orderId}
              AND order_status = 'PENDING_PAYMENT'
            """)
    int markPaid(@Param("orderId") Long orderId);
}

