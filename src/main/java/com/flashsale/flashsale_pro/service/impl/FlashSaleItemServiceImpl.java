package com.flashsale.flashsale_pro.service.impl;

import com.flashsale.flashsale_pro.entity.FlashSaleItem;
import com.flashsale.flashsale_pro.mapper.FlashSaleItemMapper;
import com.flashsale.flashsale_pro.service.FlashSaleItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class FlashSaleItemServiceImpl implements FlashSaleItemService {

    @Autowired
    private FlashSaleItemMapper flashSaleItemMapper;

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
        return flashSaleItemMapper.findById(item.getId());
    }

    @Override
    public FlashSaleItem update(FlashSaleItem item) {
        flashSaleItemMapper.update(item);
        return flashSaleItemMapper.findById(item.getId());
    }

    @Override
    public void delete(Long id) {
        flashSaleItemMapper.deleteById(id);
    }

    @Override
    public FlashSaleItem getById(Long id) {
        return flashSaleItemMapper.findById(id);
    }

    @Override
    public List<FlashSaleItem> listByEventId(Long eventId) {
        return flashSaleItemMapper.findByEventId(eventId);
    }
}

