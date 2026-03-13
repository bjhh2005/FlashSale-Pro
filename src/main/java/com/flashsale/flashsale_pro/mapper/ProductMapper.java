package com.flashsale.flashsale_pro.mapper;

import com.flashsale.flashsale_pro.entity.Product;
import org.apache.ibatis.annotations.*;

import java.util.List;

@Mapper
public interface ProductMapper {

    @Insert("""
            INSERT INTO product (name, description, original_price, status)
            VALUES (#{name}, #{description}, #{originalPrice}, #{status})
            RETURNING id
            """)
    @Options(useGeneratedKeys = true, keyProperty = "id")
    Long insert(Product product);

    @Select("SELECT id, name, description, original_price, status, created_at, updated_at FROM product WHERE id = #{id}")
    Product findById(@Param("id") Long id);

    @Select("SELECT id, name, description, original_price, status, created_at, updated_at FROM product ORDER BY id DESC")
    List<Product> findAll();

    @Update("""
            UPDATE product
            SET name = #{name},
                description = #{description},
                original_price = #{originalPrice},
                status = #{status},
                updated_at = NOW()
            WHERE id = #{id}
            """)
    int update(Product product);

    @Delete("DELETE FROM product WHERE id = #{id}")
    int deleteById(@Param("id") Long id);
}

