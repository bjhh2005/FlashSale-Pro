package com.flashsale.stock.service.impl;

import com.flashsale.stock.entity.FlashSaleItem;
import com.flashsale.stock.mapper.StockMapper;
import com.flashsale.stock.service.StockService;
import org.springframework.stereotype.Service;

@Service
public class StockServiceImpl implements StockService {
    private final StockMapper stockMapper;

    public StockServiceImpl(StockMapper stockMapper) {
        this.stockMapper = stockMapper;
    }

    @Override
    public FlashSaleItem query(Long itemId) {
        return stockMapper.findById(itemId);
    }

    @Override
    public boolean deduct(Long itemId, int quantity) {
        return stockMapper.deduct(itemId, Math.max(1, quantity)) > 0;
    }

    @Override
    public boolean restore(Long itemId, int quantity) {
        return stockMapper.restore(itemId, Math.max(1, quantity)) > 0;
    }
}

