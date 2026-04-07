package com.flashsale.order.feign;

import java.math.BigDecimal;

public class InternalItemResponse {
    private Long id;
    private Long eventId;
    private Long productId;
    private BigDecimal flashPrice;
    private Integer availableStock;

    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public Long getEventId() {
        return eventId;
    }

    public void setEventId(Long eventId) {
        this.eventId = eventId;
    }

    public Long getProductId() {
        return productId;
    }

    public void setProductId(Long productId) {
        this.productId = productId;
    }

    public BigDecimal getFlashPrice() {
        return flashPrice;
    }

    public void setFlashPrice(BigDecimal flashPrice) {
        this.flashPrice = flashPrice;
    }

    public Integer getAvailableStock() {
        return availableStock;
    }

    public void setAvailableStock(Integer availableStock) {
        this.availableStock = availableStock;
    }
}
