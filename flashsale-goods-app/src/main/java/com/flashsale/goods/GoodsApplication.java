package com.flashsale.goods;

import com.flashsale.flashsale_pro.controller.FlashSaleOrderController;
import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;

@SpringBootApplication(scanBasePackages = {"com.flashsale.flashsale_pro", "com.flashsale.goods"})
@ComponentScan(
        basePackages = {"com.flashsale.flashsale_pro", "com.flashsale.goods"},
        excludeFilters = @ComponentScan.Filter(
                type = FilterType.ASSIGNABLE_TYPE,
                classes = FlashSaleOrderController.class
        )
)
@MapperScan({"com.flashsale.flashsale_pro.mapper", "com.flashsale.goods.mapper"})
public class GoodsApplication {
    public static void main(String[] args) {
        SpringApplication.run(GoodsApplication.class, args);
    }
}
