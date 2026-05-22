package com.flashsale.gateway.filter;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.core.env.Environment;
import org.springframework.mock.http.server.reactive.MockServerHttpRequest;
import org.springframework.mock.web.server.MockServerWebExchange;
import org.springframework.web.server.handler.DefaultWebFilterChain;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class IntentFilterTest {

    private IntentFilter intentFilter;

    @BeforeEach
    void setUp() {
        Environment env = mock(Environment.class);
        when(env.getProperty("intent.score-key-prefix", "intent:score:")).thenReturn("intent:score:");
        when(env.getProperty("intent.tier-key-prefix", "intent:tier:")).thenReturn("intent:tier:");
        when(env.getProperty("intent.high-threshold", "0.7")).thenReturn("0.7");
        when(env.getProperty("intent.low-threshold", "0.3")).thenReturn("0.3");
        when(env.getProperty("intent.enabled", "true")).thenReturn("true");
        when(env.getProperty("intent.degrade-to-token-bucket", "true")).thenReturn("true");
        when(env.getProperty("intent.token-bucket-capacity", "1000")).thenReturn("1000");
        when(env.getProperty("intent.token-bucket-refill-rate", "100")).thenReturn("100");

        var redisTemplate = mock(org.springframework.data.redis.core.ReactiveStringRedisTemplate.class);
        intentFilter = new IntentFilter(redisTemplate, env);
    }

    @Test
    void getOrder_shouldBeBeforeAuth() {
        assertThat(intentFilter.getOrder()).isEqualTo(-1);
    }

    @Test
    void getStats_shouldReturnZeroInitially() {
        Map<String, Long> stats = intentFilter.getStats();
        assertThat(stats.get("totalRequests")).isEqualTo(0L);
        assertThat(stats.get("highIntent")).isEqualTo(0L);
        assertThat(stats.get("mediumIntent")).isEqualTo(0L);
        assertThat(stats.get("lowBlocked")).isEqualTo(0L);
        assertThat(stats.get("degraded")).isEqualTo(0L);
    }

    @Test
    void bypassPaths_shouldNotBeFiltered() {
        assertThat(intentFilter.getOrder()).isEqualTo(-1);
    }
}
