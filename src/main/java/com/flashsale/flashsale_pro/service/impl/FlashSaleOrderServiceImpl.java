package com.flashsale.flashsale_pro.service.impl;

import com.flashsale.flashsale_pro.config.RabbitMQConfig;
import com.flashsale.flashsale_pro.entity.FlashSaleItem;
import com.flashsale.flashsale_pro.entity.FlashSaleOrder;
import com.flashsale.flashsale_pro.mq.SeckillOrderMessage;
import com.flashsale.flashsale_pro.mapper.FlashSaleItemMapper;
import com.flashsale.flashsale_pro.mapper.FlashSaleOrderMapper;
import com.flashsale.flashsale_pro.service.FlashSaleOrderService;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ClassPathResource;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.data.redis.core.script.DefaultRedisScript;
import org.springframework.scripting.support.ResourceScriptSource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import jakarta.annotation.PostConstruct;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.concurrent.TimeUnit;

@Service
public class FlashSaleOrderServiceImpl implements FlashSaleOrderService {

    @Autowired
    private FlashSaleItemMapper flashSaleItemMapper;

    @Autowired
    private FlashSaleOrderMapper flashSaleOrderMapper;

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    @Autowired
    private RabbitTemplate rabbitTemplate;

    @Value("${flashsale.seckill.stock-key-prefix:seckill:stock:}")
    private String stockKeyPrefix;

    @Value("${flashsale.seckill.bought-key-prefix:seckill:bought:}")
    private String boughtKeyPrefix;

    @Value("${flashsale.seckill.result-key-prefix:seckill:result:}")
    private String resultKeyPrefix;

    @Value("${flashsale.seckill.result-ttl-seconds:300}")
    private long resultTtlSeconds;

    private DefaultRedisScript<Long> seckillScript;

    @PostConstruct
    public void init() {
        seckillScript = new DefaultRedisScript<>();
        seckillScript.setScriptSource(new ResourceScriptSource(new ClassPathResource("scripts/seckill_stock.lua")));
        seckillScript.setResultType(Long.class);
    }

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
    public Map<String, Object> submitSeckill(Long userId, Long itemId, Integer quantity) {
        int normalizedQty = (quantity == null || quantity <= 0) ? 1 : quantity;
        ensureStockLoaded(itemId);

        Long luaResult = stringRedisTemplate.execute(
                seckillScript,
                List.of(stockKey(itemId), boughtKey(itemId)),
                String.valueOf(userId),
                String.valueOf(normalizedQty)
        );

        if (luaResult == null) {
            return buildFailedResult(userId, itemId, "系统繁忙");
        }
        if (luaResult == 1L) {
            return buildFailedResult(userId, itemId, "库存不足");
        }
        if (luaResult == 2L) {
            return buildFailedResult(userId, itemId, "请勿重复下单");
        }

        try {
            rabbitTemplate.convertAndSend(
                    RabbitMQConfig.SECKILL_EXCHANGE,
                    RabbitMQConfig.SECKILL_ROUTING_KEY,
                    new SeckillOrderMessage(userId, itemId, normalizedQty)
            );
            putResult(userId, itemId, "QUEUING");
            Map<String, Object> data = new HashMap<>();
            data.put("status", "QUEUING");
            data.put("message", "排队中，请稍后轮询结果");
            return data;
        } catch (Exception ex) {
            rollbackRedisReservation(userId, itemId, normalizedQty);
            return buildFailedResult(userId, itemId, "秒杀请求提交失败");
        }
    }

    @Override
    public Map<String, Object> querySeckillResult(Long userId, Long itemId) {
        String value = stringRedisTemplate.opsForValue().get(resultKey(userId, itemId));
        if (value != null) {
            return parseResultValue(value);
        }
        FlashSaleOrder order = flashSaleOrderMapper.findByUserAndItem(userId, itemId);
        if (order != null) {
            Map<String, Object> data = new HashMap<>();
            data.put("status", "SUCCESS");
            data.put("orderId", order.getId());
            return data;
        }
        Map<String, Object> data = new HashMap<>();
        data.put("status", "QUEUING");
        return data;
    }

    @Transactional
    public void consumeSeckillOrder(SeckillOrderMessage message) {
        Long userId = message.getUserId();
        Long itemId = message.getItemId();
        int quantity = message.getQuantity() == null || message.getQuantity() <= 0 ? 1 : message.getQuantity();

        FlashSaleOrder existing = flashSaleOrderMapper.findByUserAndItem(userId, itemId);
        if (existing != null) {
            putResult(userId, itemId, "SUCCESS:" + existing.getId());
            return;
        }

        FlashSaleItem item = flashSaleItemMapper.findById(itemId);
        if (item == null) {
            rollbackRedisReservation(userId, itemId, quantity);
            putResult(userId, itemId, "FAILED:秒杀商品不存在");
            return;
        }

        int updatedRows = flashSaleItemMapper.decreaseStock(itemId, quantity);
        if (updatedRows <= 0) {
            rollbackRedisReservation(userId, itemId, quantity);
            putResult(userId, itemId, "FAILED:库存不足");
            return;
        }

        FlashSaleOrder order = new FlashSaleOrder();
        order.setUserId(userId);
        order.setEventId(item.getEventId());
        order.setItemId(item.getId());
        order.setProductId(item.getProductId());
        order.setQuantity(quantity);
        order.setOrderStatus("PENDING_PAYMENT");
        order.setTotalAmount(item.getFlashPrice().multiply(BigDecimal.valueOf(quantity)));

        try {
            flashSaleOrderMapper.insert(order);
            putResult(userId, itemId, "SUCCESS:" + order.getId());
        } catch (DuplicateKeyException ex) {
            FlashSaleOrder persisted = flashSaleOrderMapper.findByUserAndItem(userId, itemId);
            if (persisted != null) {
                putResult(userId, itemId, "SUCCESS:" + persisted.getId());
            } else {
                putResult(userId, itemId, "FAILED:重复下单");
            }
        }
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

    private void ensureStockLoaded(Long itemId) {
        String key = stockKey(itemId);
        Boolean exists = stringRedisTemplate.hasKey(key);
        if (Boolean.TRUE.equals(exists)) {
            return;
        }
        FlashSaleItem item = flashSaleItemMapper.findById(itemId);
        if (item == null) {
            throw new IllegalArgumentException("秒杀商品不存在");
        }
        int available = item.getAvailableStock() == null ? 0 : item.getAvailableStock();
        stringRedisTemplate.opsForValue().setIfAbsent(key, String.valueOf(available));
    }

    private Map<String, Object> buildFailedResult(Long userId, Long itemId, String message) {
        putResult(userId, itemId, "FAILED:" + message);
        Map<String, Object> data = new HashMap<>();
        data.put("status", "FAILED");
        data.put("message", message);
        return data;
    }

    private Map<String, Object> parseResultValue(String value) {
        Map<String, Object> data = new HashMap<>();
        if ("QUEUING".equals(value)) {
            data.put("status", "QUEUING");
            return data;
        }
        if (value.startsWith("SUCCESS:")) {
            data.put("status", "SUCCESS");
            data.put("orderId", Long.valueOf(value.substring("SUCCESS:".length())));
            return data;
        }
        if (value.startsWith("FAILED:")) {
            data.put("status", "FAILED");
            data.put("message", value.substring("FAILED:".length()));
            return data;
        }
        data.put("status", "QUEUING");
        return data;
    }

    private void putResult(Long userId, Long itemId, String value) {
        stringRedisTemplate.opsForValue().set(resultKey(userId, itemId), value, resultTtlSeconds, TimeUnit.SECONDS);
    }

    private void rollbackRedisReservation(Long userId, Long itemId, int quantity) {
        stringRedisTemplate.opsForValue().increment(stockKey(itemId), quantity);
        stringRedisTemplate.opsForSet().remove(boughtKey(itemId), String.valueOf(userId));
    }

    private String stockKey(Long itemId) {
        return stockKeyPrefix + itemId;
    }

    private String boughtKey(Long itemId) {
        return boughtKeyPrefix + itemId;
    }

    private String resultKey(Long userId, Long itemId) {
        return resultKeyPrefix + userId + ":" + itemId;
    }
}

