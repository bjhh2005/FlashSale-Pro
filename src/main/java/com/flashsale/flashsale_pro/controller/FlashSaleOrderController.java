package com.flashsale.flashsale_pro.controller;

import com.flashsale.flashsale_pro.common.RateLimiterService;
import com.flashsale.flashsale_pro.common.Result;
import com.flashsale.flashsale_pro.entity.FlashSaleOrder;
import com.flashsale.flashsale_pro.service.FlashSaleOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/flash-sale/order")
public class FlashSaleOrderController {

    @Autowired
    private FlashSaleOrderService flashSaleOrderService;

    @Autowired
    private RateLimiterService rateLimiterService;

    public static class CreateOrderRequest {
        private Long userId;
        private Long itemId;
        private Integer quantity;

        public Long getUserId() {
            return userId;
        }

        public void setUserId(Long userId) {
            this.userId = userId;
        }

        public Long getItemId() {
            return itemId;
        }

        public void setItemId(Long itemId) {
            this.itemId = itemId;
        }

        public Integer getQuantity() {
            return quantity;
        }

        public void setQuantity(Integer quantity) {
            this.quantity = quantity;
        }
    }

    @PostMapping
    public Result<Map<String, Object>> create(@RequestBody CreateOrderRequest request) {
        // 简单限流：同一用户对同一商品在 5 秒内最多请求 3 次
        String key = "flash_sale:" + request.getUserId() + ":" + request.getItemId();
        boolean allowed = rateLimiterService.tryAcquire(key, 3, 5);
        if (!allowed) {
            return Result.error(429, "请求过于频繁，请稍后再试");
        }

        Map<String, Object> result = flashSaleOrderService.submitSeckill(
                request.getUserId(),
                request.getItemId(),
                request.getQuantity()
        );
        return Result.success(result);
    }

    @GetMapping("/result")
    public Result<Map<String, Object>> queryResult(
            @RequestParam Long userId,
            @RequestParam Long itemId
    ) {
        return Result.success(flashSaleOrderService.querySeckillResult(userId, itemId));
    }

    @GetMapping("/user/{userId}")
    public Result<List<FlashSaleOrder>> listUserOrders(@PathVariable Long userId) {
        return Result.success(flashSaleOrderService.listUserOrders(userId));
    }

    @PostMapping("/{orderId}/pay")
    public Result<FlashSaleOrder> pay(@PathVariable Long orderId) {
        FlashSaleOrder updated = flashSaleOrderService.markOrderPaid(orderId);
        return Result.success(updated);
    }
}

