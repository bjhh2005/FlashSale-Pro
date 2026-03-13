package com.flashsale.flashsale_pro.controller;

import com.flashsale.flashsale_pro.common.Result;
import com.flashsale.flashsale_pro.entity.FlashSaleEvent;
import com.flashsale.flashsale_pro.entity.FlashSaleItem;
import com.flashsale.flashsale_pro.service.FlashSaleEventService;
import com.flashsale.flashsale_pro.service.FlashSaleItemService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/flash-sale")
public class FlashSaleQueryController {

    @Autowired
    private FlashSaleEventService flashSaleEventService;

    @Autowired
    private FlashSaleItemService flashSaleItemService;

    @GetMapping("/events")
    public Result<List<FlashSaleEvent>> listAvailableEvents() {
        OffsetDateTime now = OffsetDateTime.now();
        List<FlashSaleEvent> all = flashSaleEventService.listAll();
        List<FlashSaleEvent> visible = all.stream()
                .filter(e -> e.getEndTime() == null || e.getEndTime().isAfter(now))
                .collect(Collectors.toList());
        return Result.success(visible);
    }

    @GetMapping("/events/{eventId}/items")
    public Result<List<FlashSaleItem>> listItems(@PathVariable Long eventId) {
        return Result.success(flashSaleItemService.listByEventId(eventId));
    }

    @GetMapping("/items/{itemId}")
    public Result<FlashSaleItem> getItem(@PathVariable Long itemId) {
        return Result.success(flashSaleItemService.getById(itemId));
    }
}

