package com.flashsale.flashsale_pro.mapper;

import com.flashsale.flashsale_pro.entity.FlashSaleItem;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface FlashSaleItemMapper {

    @Insert("""
            INSERT INTO flash_sale_item (
                event_id, product_id, flash_price,
                total_stock, available_stock, sold_count,
                per_user_limit, version
            ) VALUES (
                #{eventId}, #{productId}, #{flashPrice},
                #{totalStock}, #{availableStock}, #{soldCount},
                #{perUserLimit}, #{version}
            )
            RETURNING id
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    Long insert(FlashSaleItem item);

    @Select("""
            SELECT id, event_id, product_id, flash_price,
                   total_stock, available_stock, sold_count,
                   per_user_limit, version, created_at, updated_at
            FROM flash_sale_item
            WHERE id = #{id}
            """)
    FlashSaleItem findById(@Param("id") Long id);

    @Select("""
            SELECT id, event_id, product_id, flash_price,
                   total_stock, available_stock, sold_count,
                   per_user_limit, version, created_at, updated_at
            FROM flash_sale_item
            WHERE event_id = #{eventId}
            ORDER BY id ASC
            """)
    List<FlashSaleItem> findByEventId(@Param("eventId") Long eventId);

    @Update("""
            UPDATE flash_sale_item
            SET flash_price = #{flashPrice},
                total_stock = #{totalStock},
                available_stock = #{availableStock},
                sold_count = #{soldCount},
                per_user_limit = #{perUserLimit},
                updated_at = NOW()
            WHERE id = #{id}
            """)
    int update(FlashSaleItem item);

    @Update("""
            UPDATE flash_sale_item
            SET available_stock = available_stock - #{quantity},
                sold_count = sold_count + #{quantity},
                version = version + 1,
                updated_at = NOW()
            WHERE id = #{itemId}
              AND available_stock >= #{quantity}
            """)
    int decreaseStock(@Param("itemId") Long itemId, @Param("quantity") int quantity);

    @Delete("DELETE FROM flash_sale_item WHERE id = #{id}")
    int deleteById(@Param("id") Long id);
}

