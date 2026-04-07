package com.flashsale.flashsale_pro.controller;

import com.flashsale.flashsale_pro.common.Result;
import com.flashsale.flashsale_pro.entity.FlashSaleEvent;
import com.flashsale.flashsale_pro.service.FlashSaleEventService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/flash-sale/event")
public class AdminFlashSaleEventController {

    @Autowired
    private FlashSaleEventService flashSaleEventService;

    @PostMapping
    public Result<FlashSaleEvent> create(@RequestBody FlashSaleEvent event) {
        return Result.success(flashSaleEventService.create(event));
    }

    @PutMapping("/{id}")
    public Result<FlashSaleEvent> update(@PathVariable Long id, @RequestBody FlashSaleEvent event) {
        event.setId(id);
        return Result.success(flashSaleEventService.update(event));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        flashSaleEventService.delete(id);
        return Result.success();
    }

    @GetMapping("/{id}")
    public Result<FlashSaleEvent> get(@PathVariable Long id) {
        return Result.success(flashSaleEventService.getById(id));
    }

    @GetMapping
    public Result<List<FlashSaleEvent>> list() {
        return Result.success(flashSaleEventService.listAll());
    }
}

