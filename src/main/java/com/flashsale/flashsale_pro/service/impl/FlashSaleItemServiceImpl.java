package com.flashsale.flashsale_pro.service.impl;

import com.flashsale.flashsale_pro.entity.FlashSaleItem;
import com.flashsale.flashsale_pro.mapper.FlashSaleItemMapper;
import com.flashsale.flashsale_pro.service.FlashSaleItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.concurrent.ThreadLocalRandom;
import java.util.concurrent.TimeUnit;

@Service
public class FlashSaleItemServiceImpl implements FlashSaleItemService {

    private static final String NULL_VALUE = "__NULL__";

    @Autowired
    private FlashSaleItemMapper flashSaleItemMapper;

    @Autowired
    private StringRedisTemplate stringRedisTemplate;

    @Autowired
    private ObjectMapper objectMapper;

    @Value("${flashsale.cache.goods.detail-ttl-seconds:300}")
    private long detailTtlSeconds;

    @Value("${flashsale.cache.goods.null-ttl-seconds:60}")
    private long nullTtlSeconds;

    @Value("${flashsale.cache.goods.ttl-jitter-seconds:120}")
    private int ttlJitterSeconds;

    @Value("${flashsale.cache.goods.lock-seconds:10}")
    private long lockSeconds;

    @Override
    public FlashSaleItem create(FlashSaleItem item) {
        if (item.getPerUserLimit() == null) {
            item.setPerUserLimit(1);
        }
        if (item.getSoldCount() == null) {
            item.setSoldCount(0);
        }
        if (item.getAvailableStock() == null) {
            item.setAvailableStock(item.getTotalStock());
        }
        if (item.getVersion() == null) {
            item.setVersion(0);
        }
        flashSaleItemMapper.insert(item);
        FlashSaleItem created = flashSaleItemMapper.findById(item.getId());
        deleteItemCache(item.getId());
        return created;
    }

    @Override
    public FlashSaleItem update(FlashSaleItem item) {
        flashSaleItemMapper.update(item);
        FlashSaleItem updated = flashSaleItemMapper.findById(item.getId());
        deleteItemCache(item.getId());
        return updated;
    }

    @Override
    public void delete(Long id) {
        flashSaleItemMapper.deleteById(id);
        deleteItemCache(id);
    }

    @Override
    public FlashSaleItem getById(Long id) {
        String key = itemCacheKey(id);
        String cached = stringRedisTemplate.opsForValue().get(key);
        if (cached != null) {
            if (NULL_VALUE.equals(cached)) {
                return null;
            }
            return fromJson(cached);
        }

        String lockKey = itemLockKey(id);
        Boolean lockOk = stringRedisTemplate.opsForValue().setIfAbsent(lockKey, "1", lockSeconds, TimeUnit.SECONDS);
        if (Boolean.TRUE.equals(lockOk)) {
            try {
                FlashSaleItem dbItem = flashSaleItemMapper.findById(id);
                if (dbItem == null) {
                    stringRedisTemplate.opsForValue().set(key, NULL_VALUE, nullTtlSeconds, TimeUnit.SECONDS);
                    return null;
                }
                long ttl = detailTtlSeconds + ThreadLocalRandom.current().nextInt(Math.max(ttlJitterSeconds, 1));
                stringRedisTemplate.opsForValue().set(key, toJson(dbItem), ttl, TimeUnit.SECONDS);
                return dbItem;
            } finally {
                stringRedisTemplate.delete(lockKey);
            }
        }

        // 互斥锁竞争失败时短暂等待并重试一次，避免瞬时穿透到 DB
        try {
            Thread.sleep(30L);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }
        String retry = stringRedisTemplate.opsForValue().get(key);
        if (retry == null) {
            return flashSaleItemMapper.findById(id);
        }
        if (NULL_VALUE.equals(retry)) {
            return null;
        }
        return fromJson(retry);
    }

    @Override
    public List<FlashSaleItem> listByEventId(Long eventId) {
        return flashSaleItemMapper.findByEventId(eventId);
    }

    private String itemCacheKey(Long id) {
        return "flashsale:goods:item:" + id;
    }

    private String itemLockKey(Long id) {
        return "flashsale:goods:item:lock:" + id;
    }

    private void deleteItemCache(Long id) {
        if (id != null) {
            stringRedisTemplate.delete(itemCacheKey(id));
        }
    }

    private String toJson(FlashSaleItem item) {
        try {
            return objectMapper.writeValueAsString(item);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("序列化商品详情失败", e);
        }
    }

    private FlashSaleItem fromJson(String value) {
        try {
            return objectMapper.readValue(value, FlashSaleItem.class);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("反序列化商品详情失败", e);
        }
    }
}

