package com.flashsale.flashsale_pro.service;

import com.flashsale.flashsale_pro.entity.FlashSaleOrder;

import java.util.Map;
import java.util.List;

public interface FlashSaleOrderService {

    FlashSaleOrder createOrder(Long userId, Long itemId, Integer quantity);

    Map<String, Object> submitSeckill(Long userId, Long itemId, Integer quantity);

    Map<String, Object> querySeckillResult(Long userId, Long itemId);

    List<FlashSaleOrder> listUserOrders(Long userId);

    FlashSaleOrder markOrderPaid(Long orderId);
}

