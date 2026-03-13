package com.flashsale.flashsale_pro.service.impl;

import com.flashsale.flashsale_pro.entity.FlashSaleItem;
import com.flashsale.flashsale_pro.entity.FlashSaleOrder;
import com.flashsale.flashsale_pro.mapper.FlashSaleItemMapper;
import com.flashsale.flashsale_pro.mapper.FlashSaleOrderMapper;
import com.flashsale.flashsale_pro.service.FlashSaleOrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.List;

@Service
public class FlashSaleOrderServiceImpl implements FlashSaleOrderService {

    @Autowired
    private FlashSaleItemMapper flashSaleItemMapper;

    @Autowired
    private FlashSaleOrderMapper flashSaleOrderMapper;

    @Override
    @Transactional
    public FlashSaleOrder createOrder(Long userId, Long itemId, Integer quantity) {
        if (quantity == null || quantity <= 0) {
            quantity = 1;
        }

        // 防重复下单：一个用户对同一秒杀商品只允许一笔订单
        FlashSaleOrder existing = flashSaleOrderMapper.findByUserAndItem(userId, itemId);
        if (existing != null) {
            return existing;
        }

        FlashSaleItem item = flashSaleItemMapper.findById(itemId);
        if (item == null) {
            throw new IllegalArgumentException("秒杀商品不存在");
        }

        if (item.getAvailableStock() < quantity) {
            throw new IllegalStateException("库存不足");
        }

        // 并发安全的库存扣减：依赖数据库条件更新避免超卖
        int updatedRows = flashSaleItemMapper.decreaseStock(itemId, quantity);
        if (updatedRows <= 0) {
            throw new IllegalStateException("库存扣减失败，可能已被抢光");
        }

        FlashSaleOrder order = new FlashSaleOrder();
        order.setUserId(userId);
        order.setEventId(item.getEventId());
        order.setItemId(item.getId());
        order.setProductId(item.getProductId());
        order.setQuantity(quantity);
        order.setOrderStatus("PENDING_PAYMENT");
        BigDecimal totalAmount = item.getFlashPrice().multiply(BigDecimal.valueOf(quantity));
        order.setTotalAmount(totalAmount);

        flashSaleOrderMapper.insert(order);
        return flashSaleOrderMapper.findById(order.getId());
    }

    @Override
    public List<FlashSaleOrder> listUserOrders(Long userId) {
        return flashSaleOrderMapper.findByUserId(userId);
    }

    @Override
    @Transactional
    public FlashSaleOrder markOrderPaid(Long orderId) {
        int updated = flashSaleOrderMapper.markPaid(orderId);
        if (updated <= 0) {
            throw new IllegalStateException("订单状态更新失败");
        }
        return flashSaleOrderMapper.findById(orderId);
    }
}

