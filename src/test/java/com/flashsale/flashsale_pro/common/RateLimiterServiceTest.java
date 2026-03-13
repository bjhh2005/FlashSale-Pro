package com.flashsale.flashsale_pro.common;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

class RateLimiterServiceTest {

    private final RateLimiterService rateLimiterService = new RateLimiterService();

    @Test
    void tryAcquire_allowsUpToMaxRequestsInSameWindow() {
        String key = "user-1";
        int maxRequests = 3;
        int windowSeconds = 5;

        assertThat(rateLimiterService.tryAcquire(key, maxRequests, windowSeconds)).isTrue();
        assertThat(rateLimiterService.tryAcquire(key, maxRequests, windowSeconds)).isTrue();
        assertThat(rateLimiterService.tryAcquire(key, maxRequests, windowSeconds)).isTrue();

        // 第 4 次应该被限流
        assertThat(rateLimiterService.tryAcquire(key, maxRequests, windowSeconds)).isFalse();
    }
}

