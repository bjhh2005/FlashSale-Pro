package com.flashsale.flashsale_pro.service;

import com.flashsale.flashsale_pro.entity.FlashSaleItem;

import java.util.List;

public interface FlashSaleItemService {

    FlashSaleItem create(FlashSaleItem item);

    FlashSaleItem update(FlashSaleItem item);

    void delete(Long id);

    FlashSaleItem getById(Long id);

    List<FlashSaleItem> listByEventId(Long eventId);
}

