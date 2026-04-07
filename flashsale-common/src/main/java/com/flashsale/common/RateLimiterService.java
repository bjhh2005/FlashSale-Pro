package com.flashsale.common;

import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class RateLimiterService {

    private static class Counter {
        long windowStartEpochSeconds;
        int count;
    }

    private final Map<String, Counter> counters = new ConcurrentHashMap<>();

    public boolean tryAcquire(String key, int maxRequests, int windowSeconds) {
        long now = Instant.now().getEpochSecond();
        Counter counter = counters.computeIfAbsent(key, k -> {
            Counter c = new Counter();
            c.windowStartEpochSeconds = now;
            c.count = 0;
            return c;
        });

        synchronized (counter) {
            if (now - counter.windowStartEpochSeconds >= windowSeconds) {
                counter.windowStartEpochSeconds = now;
                counter.count = 0;
            }
            if (counter.count >= maxRequests) {
                return false;
            }
            counter.count++;
            return true;
        }
    }
}
