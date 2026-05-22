package com.flashsale.flashsale_pro.controller;

import com.flashsale.flashsale_pro.common.Result;
import com.flashsale.flashsale_pro.entity.UserBehaviorEvent;
import com.flashsale.flashsale_pro.entity.UserFeatureMatrix;
import com.flashsale.flashsale_pro.service.UserBehaviorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/behavior")
public class UserBehaviorController {

    @Autowired
    private UserBehaviorService userBehaviorService;

    public static class RecordEventRequest {
        private Long userId;
        private Long productId;
        private Long eventId;
        private Long itemId;
        private String action;
        private Integer dwellSeconds;
        private String extra;

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
    }

    @PostMapping("/event")
    public Result<UserBehaviorEvent> recordEvent(@RequestBody RecordEventRequest request) {
        UserBehaviorEvent event = new UserBehaviorEvent();
        event.setUserId(request.getUserId());
        event.setProductId(request.getProductId());
        event.setEventId(request.getEventId());
        event.setItemId(request.getItemId());
        event.setAction(request.getAction());
        event.setDwellSeconds(request.getDwellSeconds());
        event.setExtra(request.getExtra());
        UserBehaviorEvent saved = userBehaviorService.recordEvent(event);
        return Result.success(saved);
    }

    @PostMapping("/events/batch")
    public Result<List<UserBehaviorEvent>> recordEventsBatch(@RequestBody List<RecordEventRequest> requests) {
        List<UserBehaviorEvent> saved = requests.stream().map(req -> {
            UserBehaviorEvent event = new UserBehaviorEvent();
            event.setUserId(req.getUserId());
            event.setProductId(req.getProductId());
            event.setEventId(req.getEventId());
            event.setItemId(req.getItemId());
            event.setAction(req.getAction());
            event.setDwellSeconds(req.getDwellSeconds());
            event.setExtra(req.getExtra());
            return userBehaviorService.recordEvent(event);
        }).toList();
        return Result.success(saved);
    }

    @GetMapping("/events")
    public Result<List<UserBehaviorEvent>> getUserEvents(
            @RequestParam Long userId,
            @RequestParam(defaultValue = "100") int limit) {
        return Result.success(userBehaviorService.getUserEvents(userId, limit));
    }

    @GetMapping("/events/{action}")
    public Result<List<UserBehaviorEvent>> getUserEventsByAction(
            @RequestParam Long userId,
            @PathVariable String action,
            @RequestParam(defaultValue = "100") int limit) {
        return Result.success(userBehaviorService.getUserEventsByAction(userId, action, limit));
    }

    @PostMapping("/feature-matrix/compute")
    public Result<UserFeatureMatrix> computeFeatureMatrix(@RequestBody Map<String, Long> params) {
        Long userId = params.get("userId");
        Long eventId = params.get("eventId");
        return Result.success(userBehaviorService.computeFeatureMatrix(userId, eventId));
    }

    @GetMapping("/feature-matrix")
    public Result<UserFeatureMatrix> getFeatureMatrix(@RequestParam Long userId) {
        return Result.success(userBehaviorService.getFeatureMatrix(userId));
    }
}
