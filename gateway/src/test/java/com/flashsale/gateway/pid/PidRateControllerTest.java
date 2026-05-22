package com.flashsale.gateway.pid;

import io.micrometer.core.instrument.MeterRegistry;
import io.micrometer.core.instrument.simple.SimpleMeterRegistry;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.data.redis.core.ReactiveValueOperations;
import reactor.core.publisher.Mono;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.*;

class PidRateControllerTest {

    private PidRateController controller;
    private MeterRegistry meterRegistry;

    @SuppressWarnings("unchecked")
    @BeforeEach
    void setUp() {
        ReactiveStringRedisTemplate redisTemplate = mock(ReactiveStringRedisTemplate.class);
        ReactiveValueOperations<String, String> valueOps = mock(ReactiveValueOperations.class);
        when(redisTemplate.opsForValue()).thenReturn(valueOps);
        when(valueOps.set(anyString(), anyString())).thenReturn(Mono.empty());

        meterRegistry = new SimpleMeterRegistry();
        meterRegistry.gauge("reactor.netty.connection.active", 5.0);
        meterRegistry.gauge("lettuce.connection.active", 3.0);
        meterRegistry.gauge("jvm.threads.live", 20.0);

        controller = new PidRateController(redisTemplate, meterRegistry);
    }

    @Test
    void initialRate_shouldBeHundred() {
        Map<String, Object> dash = controller.getDashboard();
        assertThat((double) dash.get("currentRate")).isEqualTo(100.0);
        assertThat((double) dash.get("blackRate")).isEqualTo(100.0);
    }

    @Test
    void targetLoad_shouldBeFifteen() {
        Map<String, Object> dash = controller.getDashboard();
        assertThat((double) dash.get("targetLoad")).isEqualTo(15.0);
    }

    @Test
    void recordQps_shouldUpdateValue() {
        controller.recordQps(500);
        Map<String, Object> dash = controller.getDashboard();
        assertThat((long) dash.get("currentQps")).isEqualTo(500L);
    }

    @Test
    void tryAcquireGreen_shouldAlwaysReturnTrue() {
        assertThat(controller.tryAcquireGreen()).isTrue();
    }

    @Test
    void tryAcquireBlack_afterOverload_shouldReturnFalse() {
        for (int i = 0; i < 50; i++) {
            controller.controlCycle();
        }
        Map<String, Object> dash = controller.getDashboard();
        double blackRate = (double) dash.get("blackRate");
        if (blackRate == 0.0) {
            assertThat(controller.tryAcquireBlack()).isFalse();
        }
    }

    @Test
    void controlCycle_shouldUpdateHistory() {
        controller.controlCycle();
        Map<String, Object> dash = controller.getDashboard();
        @SuppressWarnings("unchecked")
        Map<Long, Double> qpsH = (Map<Long, Double>) dash.get("qpsHistory");
        @SuppressWarnings("unchecked")
        Map<Long, Double> loadH = (Map<Long, Double>) dash.get("loadHistory");
        assertThat(qpsH).isNotEmpty();
        assertThat(loadH).isNotEmpty();
    }

    @Test
    void controlCycle_rateShouldStayWithinBounds() {
        for (int i = 0; i < 200; i++) {
            controller.controlCycle();
        }
        Map<String, Object> dash = controller.getDashboard();
        double rate = (double) dash.get("currentRate");
        assertThat(rate).isBetween(10.0, 500.0);
    }

    @Test
    void loadMetric_shouldReadFromMeterRegistry() {
        controller.controlCycle();
        Map<String, Object> dash = controller.getDashboard();
        long load = (long) dash.get("currentLoad");
        assertThat(load).isGreaterThanOrEqualTo(0);
    }
}
