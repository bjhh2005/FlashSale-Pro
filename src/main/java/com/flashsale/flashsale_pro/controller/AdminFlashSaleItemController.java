package com.flashsale.flashsale_pro.controller;

import com.flashsale.flashsale_pro.common.Result;
import com.flashsale.flashsale_pro.entity.FlashSaleItem;
import com.flashsale.flashsale_pro.service.FlashSaleItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/admin/flash-sale/item")
public class AdminFlashSaleItemController {

    @Autowired
    private FlashSaleItemService flashSaleItemService;

    @PostMapping
    public Result<FlashSaleItem> create(@RequestBody FlashSaleItem item) {
        return Result.success(flashSaleItemService.create(item));
    }

    @PutMapping("/{id}")
    public Result<FlashSaleItem> update(@PathVariable Long id, @RequestBody FlashSaleItem item) {
        item.setId(id);
        return Result.success(flashSaleItemService.update(item));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        flashSaleItemService.delete(id);
        return Result.success();
    }

    @GetMapping("/{id}")
    public Result<FlashSaleItem> get(@PathVariable Long id) {
        return Result.success(flashSaleItemService.getById(id));
    }

    @GetMapping("/by-event/{eventId}")
    public Result<List<FlashSaleItem>> listByEvent(@PathVariable Long eventId) {
        return Result.success(flashSaleItemService.listByEventId(eventId));
    }
}

