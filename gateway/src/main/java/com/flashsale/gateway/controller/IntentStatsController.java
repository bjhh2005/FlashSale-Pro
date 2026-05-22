package com.flashsale.gateway.controller;

import com.flashsale.gateway.filter.IntentFilter;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/actuator/intent")
public class IntentStatsController {

    private final IntentFilter intentFilter;

    public IntentStatsController(IntentFilter intentFilter) {
        this.intentFilter = intentFilter;
    }

    @GetMapping("/stats")
    public Map<String, Long> getStats() {
        return intentFilter.getStats();
    }
}
