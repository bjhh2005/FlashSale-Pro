package com.flashsale.goods.internal;

import com.flashsale.flashsale_pro.entity.FlashSaleItem;
import com.flashsale.flashsale_pro.mapper.FlashSaleItemMapper;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/internal/items")
public class InternalItemController {

    private final FlashSaleItemMapper flashSaleItemMapper;

    @Value("${internal.api.token:phase_c_internal_token}")
    private String internalApiToken;

    public InternalItemController(FlashSaleItemMapper flashSaleItemMapper) {
        this.flashSaleItemMapper = flashSaleItemMapper;
    }

    @GetMapping("/{itemId}")
    public InternalItemResponse getItem(
            @PathVariable Long itemId,
            @RequestHeader(value = "X-Internal-Token", required = false) String token
    ) {
        if (!internalApiToken.equals(token)) {
            throw new IllegalArgumentException("internal token invalid");
        }
        FlashSaleItem item = flashSaleItemMapper.findById(itemId);
        if (item == null) {
            return null;
        }
        InternalItemResponse response = new InternalItemResponse();
        response.setId(item.getId());
        response.setEventId(item.getEventId());
        response.setProductId(item.getProductId());
        response.setFlashPrice(item.getFlashPrice());
        response.setAvailableStock(item.getAvailableStock());
        return response;
    }
}
