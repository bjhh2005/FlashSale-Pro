package com.flashsale.stock.service;

import com.flashsale.stock.entity.FlashSaleItem;

public interface StockService {
    FlashSaleItem query(Long itemId);

    boolean deduct(Long itemId, int quantity);

    boolean restore(Long itemId, int quantity);
}

