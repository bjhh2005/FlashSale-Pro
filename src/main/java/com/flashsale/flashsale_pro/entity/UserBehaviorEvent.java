package com.flashsale.flashsale_pro.entity;

import java.time.OffsetDateTime;

public class UserBehaviorEvent {
    private Long id;
    private Long userId;
    private Long productId;
    private Long eventId;
    private Long itemId;
    private String action;
    private Integer dwellSeconds;
    private String extra;
    private OffsetDateTime createdAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getProductId() { return productId; }
    public void setProductId(Long productId) { this.productId = productId; }
    public Long getEventId() { return eventId; }
    public void setEventId(Long eventId) { this.eventId = eventId; }
    public Long getItemId() { return itemId; }
    public void setItemId(Long itemId) { this.itemId = itemId; }
    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }
    public Integer getDwellSeconds() { return dwellSeconds; }
    public void setDwellSeconds(Integer dwellSeconds) { this.dwellSeconds = dwellSeconds; }
    public String getExtra() { return extra; }
    public void setExtra(String extra) { this.extra = extra; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
}
