package com.flashsale.flashsale_pro.service;

import com.flashsale.flashsale_pro.entity.FlashSaleEvent;

import java.util.List;

public interface FlashSaleEventService {

    FlashSaleEvent create(FlashSaleEvent event);

    FlashSaleEvent update(FlashSaleEvent event);

    void delete(Long id);

    FlashSaleEvent getById(Long id);

    List<FlashSaleEvent> listAll();
}

