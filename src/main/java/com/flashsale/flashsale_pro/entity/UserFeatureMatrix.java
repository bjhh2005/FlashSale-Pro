package com.flashsale.flashsale_pro.entity;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

public class UserFeatureMatrix {
    private Long id;
    private Long userId;
    private Long eventId;
    private int clickCount;
    private int favoriteCount;
    private int addToCartCount;
    private int browseCount;
    private int shareCount;
    private int purchaseCount;
    private BigDecimal avgDwellSeconds;
    private int recent7dActionCount;
    private int recent1dActionCount;
    private BigDecimal actionDecayScore;
    private int crossProductCount;
    private BigDecimal priceSensitivity;
    private BigDecimal purchaseIntentScore;
    private OffsetDateTime intentScoreUpdatedAt;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }
    public Long getEventId() { return eventId; }
    public void setEventId(Long eventId) { this.eventId = eventId; }
    public int getClickCount() { return clickCount; }
    public void setClickCount(int clickCount) { this.clickCount = clickCount; }
    public int getFavoriteCount() { return favoriteCount; }
    public void setFavoriteCount(int favoriteCount) { this.favoriteCount = favoriteCount; }
    public int getAddToCartCount() { return addToCartCount; }
    public void setAddToCartCount(int addToCartCount) { this.addToCartCount = addToCartCount; }
    public int getBrowseCount() { return browseCount; }
    public void setBrowseCount(int browseCount) { this.browseCount = browseCount; }
    public int getShareCount() { return shareCount; }
    public void setShareCount(int shareCount) { this.shareCount = shareCount; }
    public int getPurchaseCount() { return purchaseCount; }
    public void setPurchaseCount(int purchaseCount) { this.purchaseCount = purchaseCount; }
    public BigDecimal getAvgDwellSeconds() { return avgDwellSeconds; }
    public void setAvgDwellSeconds(BigDecimal avgDwellSeconds) { this.avgDwellSeconds = avgDwellSeconds; }
    public int getRecent7dActionCount() { return recent7dActionCount; }
    public void setRecent7dActionCount(int recent7dActionCount) { this.recent7dActionCount = recent7dActionCount; }
    public int getRecent1dActionCount() { return recent1dActionCount; }
    public void setRecent1dActionCount(int recent1dActionCount) { this.recent1dActionCount = recent1dActionCount; }
    public BigDecimal getActionDecayScore() { return actionDecayScore; }
    public void setActionDecayScore(BigDecimal actionDecayScore) { this.actionDecayScore = actionDecayScore; }
    public int getCrossProductCount() { return crossProductCount; }
    public void setCrossProductCount(int crossProductCount) { this.crossProductCount = crossProductCount; }
    public BigDecimal getPriceSensitivity() { return priceSensitivity; }
    public void setPriceSensitivity(BigDecimal priceSensitivity) { this.priceSensitivity = priceSensitivity; }
    public BigDecimal getPurchaseIntentScore() { return purchaseIntentScore; }
    public void setPurchaseIntentScore(BigDecimal purchaseIntentScore) { this.purchaseIntentScore = purchaseIntentScore; }
    public OffsetDateTime getIntentScoreUpdatedAt() { return intentScoreUpdatedAt; }
    public void setIntentScoreUpdatedAt(OffsetDateTime intentScoreUpdatedAt) { this.intentScoreUpdatedAt = intentScoreUpdatedAt; }
    public OffsetDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(OffsetDateTime createdAt) { this.createdAt = createdAt; }
    public OffsetDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(OffsetDateTime updatedAt) { this.updatedAt = updatedAt; }
}
