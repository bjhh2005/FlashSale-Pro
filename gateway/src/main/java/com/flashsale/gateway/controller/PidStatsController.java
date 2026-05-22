package com.flashsale.gateway.controller;

import com.flashsale.gateway.pid.PidRateController;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/actuator/pid")
public class PidStatsController {

    private final PidRateController pidController;

    public PidStatsController(PidRateController pidController) {
        this.pidController = pidController;
    }

    @GetMapping("/dashboard")
    public Map<String, Object> getDashboard() {
        return pidController.getDashboard();
    }
}
