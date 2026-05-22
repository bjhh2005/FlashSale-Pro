package com.flashsale.order;

import org.mybatis.spring.annotation.MapperScan;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cloud.openfeign.EnableFeignClients;

@EnableFeignClients(basePackages = "com.flashsale.order.feign")
@SpringBootApplication(scanBasePackages = {"com.flashsale.flashsale_pro", "com.flashsale.order"})
@MapperScan({"com.flashsale.flashsale_pro.mapper", "com.flashsale.order.mapper"})
public class OrderApplication {
    public static void main(String[] args) {
        SpringApplication.run(OrderApplication.class, args);
    }
}
