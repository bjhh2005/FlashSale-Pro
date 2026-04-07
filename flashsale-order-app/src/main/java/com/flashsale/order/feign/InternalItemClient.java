package com.flashsale.order.feign;

import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;

@FeignClient(name = "goods-internal", url = "${goods.internal.base-url:http://localhost:8081}")
public interface InternalItemClient {

    @GetMapping("/internal/items/{itemId}")
    InternalItemResponse getItem(
            @PathVariable("itemId") Long itemId,
            @RequestHeader("X-Internal-Token") String token
    );
}
