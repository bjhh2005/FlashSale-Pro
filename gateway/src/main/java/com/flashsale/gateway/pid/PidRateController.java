package com.flashsale.gateway.pid;

import io.micrometer.core.instrument.MeterRegistry;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.redis.core.ReactiveStringRedisTemplate;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicLong;

@Component
@EnableScheduling
public class PidRateController {

    private static final Logger log = LoggerFactory.getLogger(PidRateController.class);

    private static final double KP = 2.5;
    private static final double KI = 0.5;
    private static final double KD = 1.0;
    private static final double TARGET_LOAD = 15.0;
    private static final long PERIOD_MS = 100;
    private static final String REDIS_RATE_KEY = "flashsale:pid:token_rate";
    private static final String REDIS_BLACK_RATE_KEY = "flashsale:pid:black_rate";

    private final ReactiveStringRedisTemplate redisTemplate;
    private final MeterRegistry meterRegistry;

    private double ek = 0.0;
    private double ek1 = 0.0;
    private double ek2 = 0.0;
    private double currentRate = 100.0;
    private double blackRate = 100.0;

    private final AtomicLong currentQps = new AtomicLong(0);
    private final AtomicLong currentLoad = new AtomicLong(0);
    private final Map<Long, Double> qpsHistory = new ConcurrentHashMap<>();
    private final Map<Long, Double> loadHistory = new ConcurrentHashMap<>();

    public PidRateController(ReactiveStringRedisTemplate redisTemplate, MeterRegistry meterRegistry) {
        this.redisTemplate = redisTemplate;
        this.meterRegistry = meterRegistry;
    }

    @Scheduled(fixedRate = PERIOD_MS)
    public void controlCycle() {
        long load = getCurrentLoadMetric();
        long qps = currentQps.get();
        currentLoad.set(load);

        ek = TARGET_LOAD - load;

        double deltaU = KP * (ek - ek1)
                + KI * ek
                + KD * (ek - 2 * ek1 + ek2);

        ek2 = ek1;
        ek1 = ek;

        currentRate = Math.max(10, Math.min(500, currentRate + deltaU));

        if (ek < 0) {
            blackRate = 0;
        } else {
            blackRate = Math.max(0, Math.min(currentRate * 0.5, blackRate + deltaU * 0.3));
        }

        redisTemplate.opsForValue().set(REDIS_RATE_KEY, String.format("%.2f", currentRate)).subscribe();
        redisTemplate.opsForValue().set(REDIS_BLACK_RATE_KEY, String.format("%.2f", blackRate)).subscribe();

        long now = System.currentTimeMillis() / 1000;
        qpsHistory.put(now, (double) qps);
        loadHistory.put(now, (double) load);
        if (qpsHistory.size() > 300) {
            qpsHistory.keySet().stream().sorted().limit(qpsHistory.size() - 300).forEach(qpsHistory::remove);
            loadHistory.keySet().stream().sorted().limit(loadHistory.size() - 300).forEach(loadHistory::remove);
        }
    }

    public void recordQps(long count) {
        currentQps.set(count);
    }

    public boolean tryAcquireGreen() {
        return true;
    }

    public boolean tryAcquireYellow() {
        return Math.random() < (currentRate / 200.0);
    }

    public boolean tryAcquireBlack() {
        return Math.random() < (blackRate / 200.0);
    }

    private long getCurrentLoadMetric() {
        double nettyActive = getGaugeValue("reactor.netty.connection.active");
        double redisActive = getGaugeValue("lettuce.connection.active");
        double jvmThreads = getGaugeValue("jvm.threads.live");
        return (long) (nettyActive + redisActive * 2 + jvmThreads * 0.1);
    }

    private double getGaugeValue(String metricName) {
        io.micrometer.core.instrument.Gauge gauge = meterRegistry.find(metricName).gauge();
        return (gauge != null) ? gauge.value() : 0.0;
    }

    public Map<String, Object> getDashboard() {
        return java.util.Map.ofEntries(
                java.util.Map.entry("currentRate", currentRate),
                java.util.Map.entry("blackRate", blackRate),
                java.util.Map.entry("currentQps", currentQps.get()),
                java.util.Map.entry("currentLoad", currentLoad.get()),
                java.util.Map.entry("targetLoad", TARGET_LOAD),
                java.util.Map.entry("error", ek),
                java.util.Map.entry("kp", KP),
                java.util.Map.entry("ki", KI),
                java.util.Map.entry("kd", KD),
                java.util.Map.entry("qpsHistory", qpsHistory),
                java.util.Map.entry("loadHistory", loadHistory)
        );
    }
}
