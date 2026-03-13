package com.flashsale.flashsale_pro.service.impl;

import com.flashsale.flashsale_pro.entity.FlashSaleEvent;
import com.flashsale.flashsale_pro.mapper.FlashSaleEventMapper;
import com.flashsale.flashsale_pro.service.FlashSaleEventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FlashSaleEventServiceImpl implements FlashSaleEventService {

    @Autowired
    private FlashSaleEventMapper flashSaleEventMapper;

    @Override
    public FlashSaleEvent create(FlashSaleEvent event) {
        if (event.getStatus() == null) {
            event.setStatus("DRAFT");
        }
        flashSaleEventMapper.insert(event);
        return flashSaleEventMapper.findById(event.getId());
    }

    @Override
    public FlashSaleEvent update(FlashSaleEvent event) {
        flashSaleEventMapper.update(event);
        return flashSaleEventMapper.findById(event.getId());
    }

    @Override
    public void delete(Long id) {
        flashSaleEventMapper.deleteById(id);
    }

    @Override
    public FlashSaleEvent getById(Long id) {
        return flashSaleEventMapper.findById(id);
    }

    @Override
    public List<FlashSaleEvent> listAll() {
        return flashSaleEventMapper.findAll();
    }
}

