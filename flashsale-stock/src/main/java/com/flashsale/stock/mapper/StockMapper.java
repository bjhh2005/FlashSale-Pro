package com.flashsale.stock.mapper;

import com.flashsale.stock.entity.FlashSaleItem;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface StockMapper {

    @Select("SELECT id,event_id,product_id,flash_price,available_stock FROM flash_sale_item WHERE id = #{itemId}")
    FlashSaleItem findById(@Param("itemId") Long itemId);

    @Update("""
            UPDATE flash_sale_item
            SET available_stock = available_stock - #{quantity},
                sold_count = sold_count + #{quantity},
                version = version + 1,
                updated_at = NOW()
            WHERE id = #{itemId}
              AND available_stock >= #{quantity}
            """)
    int deduct(@Param("itemId") Long itemId, @Param("quantity") int quantity);

    @Update("""
            UPDATE flash_sale_item
            SET available_stock = available_stock + #{quantity},
                sold_count = CASE WHEN sold_count >= #{quantity} THEN sold_count - #{quantity} ELSE 0 END,
                version = version + 1,
                updated_at = NOW()
            WHERE id = #{itemId}
            """)
    int restore(@Param("itemId") Long itemId, @Param("quantity") int quantity);
}

