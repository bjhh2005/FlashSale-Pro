package com.flashsale.flashsale_pro.mapper;

import com.flashsale.flashsale_pro.entity.FlashSaleEvent;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface FlashSaleEventMapper {

    @Insert("""
            INSERT INTO flash_sale_event (name, start_time, end_time, status)
            VALUES (#{name}, #{startTime}, #{endTime}, #{status})
            RETURNING id
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    Long insert(FlashSaleEvent event);

    @Select("""
            SELECT id, name, start_time, end_time, status, created_at, updated_at
            FROM flash_sale_event
            WHERE id = #{id}
            """)
    FlashSaleEvent findById(@Param("id") Long id);

    @Select("""
            SELECT id, name, start_time, end_time, status, created_at, updated_at
            FROM flash_sale_event
            ORDER BY start_time DESC
            """)
    List<FlashSaleEvent> findAll();

    @Update("""
            UPDATE flash_sale_event
            SET name = #{name},
                start_time = #{startTime},
                end_time = #{endTime},
                status = #{status},
                updated_at = NOW()
            WHERE id = #{id}
            """)
    int update(FlashSaleEvent event);

    @Delete("DELETE FROM flash_sale_event WHERE id = #{id}")
    int deleteById(@Param("id") Long id);
}

