package com.flashsale.gateway.controller;

import com.flashsale.gateway.filter.EntropyTrafficFilter;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/actuator/entropy")
public class EntropyStatsController {

    private final EntropyTrafficFilter filter;

    public EntropyStatsController(EntropyTrafficFilter filter) {
        this.filter = filter;
    }

    @GetMapping("/stats")
    public Map<String, Long> getStats() {
        return filter.getStats();
    }
}
