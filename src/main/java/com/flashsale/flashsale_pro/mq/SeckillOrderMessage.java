package com.flashsale.flashsale_pro.mq;

import java.io.Serializable;

public class SeckillOrderMessage implements Serializable {
    private Long userId;
    private Long itemId;
    private Integer quantity;

    public SeckillOrderMessage() {
    }

    public SeckillOrderMessage(Long userId, Long itemId, Integer quantity) {
        this.userId = userId;
        this.itemId = itemId;
        this.quantity = quantity;
    }

    public Long getUserId() {
        return userId;
    }

    public void setUserId(Long userId) {
        this.userId = userId;
    }

    public Long getItemId() {
        return itemId;
    }

    public void setItemId(Long itemId) {
        this.itemId = itemId;
    }

    public Integer getQuantity() {
        return quantity;
    }

    public void setQuantity(Integer quantity) {
        this.quantity = quantity;
    }
}
