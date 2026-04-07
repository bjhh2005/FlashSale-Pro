package com.flashsale.stock.controller;

import com.flashsale.common.Result;
import com.flashsale.stock.dto.StockChangeRequest;
import com.flashsale.stock.entity.FlashSaleItem;
import com.flashsale.stock.service.StockService;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/stock")
public class StockController {
    private final StockService stockService;

    public StockController(StockService stockService) {
        this.stockService = stockService;
    }

    @GetMapping("/items/{itemId}")
    public Result<FlashSaleItem> get(@PathVariable Long itemId) {
        FlashSaleItem item = stockService.query(itemId);
        if (item == null) {
            return Result.error(404, "秒杀商品不存在");
        }
        return Result.success(item);
    }

    @PostMapping("/deduct")
    public Result<Map<String, Object>> deduct(@RequestBody StockChangeRequest request) {
        boolean ok = stockService.deduct(request.getItemId(), request.getQuantity() == null ? 1 : request.getQuantity());
        Map<String, Object> data = new HashMap<>();
        data.put("success", ok);
        return ok ? Result.success(data) : Result.error(409, "库存不足");
    }

    @PostMapping("/restore")
    public Result<Map<String, Object>> restore(@RequestBody StockChangeRequest request) {
        boolean ok = stockService.restore(request.getItemId(), request.getQuantity() == null ? 1 : request.getQuantity());
        Map<String, Object> data = new HashMap<>();
        data.put("success", ok);
        return ok ? Result.success(data) : Result.error(500, "库存回补失败");
    }
}

