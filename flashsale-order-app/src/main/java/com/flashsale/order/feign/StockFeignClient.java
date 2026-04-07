package com.flashsale.order.feign;

import com.flashsale.common.Result;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

import java.util.Map;

@FeignClient(name = "flashsale-stock")
public interface StockFeignClient {
    @PostMapping("/stock/deduct")
    Result<Map<String, Object>> deduct(@RequestBody Map<String, Object> payload);

    @PostMapping("/stock/restore")
    Result<Map<String, Object>> restore(@RequestBody Map<String, Object> payload);
}

