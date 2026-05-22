package com.flashsale.order.init;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Component;

import java.util.Random;

@Component
public class BIDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(BIDataInitializer.class);

    private static final String KEY_PREFIX = "flashsale:bi:matrix:";
    private static final String[] STATES = {"DETAIL", "FAV", "CART", "SECKILL"};
    private static final int HIGH_POTENTIAL_COUNT = 300;
    private static final int BOT_COUNT = 200;
    private static final int TOTAL_USERS = 500;

    private final StringRedisTemplate redisTemplate;
    private final Random rng = new Random(42);

    public BIDataInitializer(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    @Override
    public void run(String... args) {
        log.info("[BI-Init] Starting Redis behavior matrix preheat for {} users...", TOTAL_USERS);
        long start = System.currentTimeMillis();

        redisTemplate.executePipelined((org.springframework.data.redis.core.RedisCallback<Object>) conn -> {
            preloadHighPotentialUsers(conn);
            preloadBotUsers(conn);
            return null;
        });

        long elapsed = System.currentTimeMillis() - start;
        log.info("[BI-Init] Preheat complete: {} users loaded in {}ms", TOTAL_USERS, elapsed);
    }

    @SuppressWarnings("unchecked")
    private void preloadHighPotentialUsers(org.springframework.data.redis.connection.RedisConnection conn) {
        int[][] transitionTemplate = {
                {0, 15, 5, 2},
                {0, 0,  10, 3},
                {0, 0,  0,  8},
                {0, 0,  0,  1}
        };

        var stringConn = conn.stringCommands();
        for (int uid = 1; uid <= HIGH_POTENTIAL_COUNT; uid++) {
            int[][] matrix = jitterMatrix(transitionTemplate, 0.15);
            for (int i = 0; i < STATES.length; i++) {
                for (int j = 0; j < STATES.length; j++) {
                    if (matrix[i][j] > 0) {
                        byte[] key = (KEY_PREFIX + uid + ":" + STATES[i] + ":" + STATES[j]).getBytes(java.nio.charset.StandardCharsets.UTF_8);
                        byte[] val = String.valueOf(matrix[i][j]).getBytes(java.nio.charset.StandardCharsets.UTF_8);
                        stringConn.set(key, val);
                    }
                }
            }
        }
        log.info("[BI-Init] {} high-potential users preheated", HIGH_POTENTIAL_COUNT);
    }

    @SuppressWarnings("unchecked")
    private void preloadBotUsers(org.springframework.data.redis.connection.RedisConnection conn) {
        var stringConn = conn.stringCommands();
        for (int uid = HIGH_POTENTIAL_COUNT + 1; uid <= TOTAL_USERS; uid++) {
            for (int i = 0; i < STATES.length; i++) {
                for (int j = 0; j < STATES.length; j++) {
                    int count = 0;
                    if (i == 0 && j == 3) {
                        count = 50 + rng.nextInt(30);
                    }
                    if (count > 0) {
                        byte[] key = (KEY_PREFIX + uid + ":" + STATES[i] + ":" + STATES[j]).getBytes(java.nio.charset.StandardCharsets.UTF_8);
                        byte[] val = String.valueOf(count).getBytes(java.nio.charset.StandardCharsets.UTF_8);
                        stringConn.set(key, val);
                    }
                }
            }
        }
        log.info("[BI-Init] {} bot users preheated", BOT_COUNT);
    }

    private int[][] jitterMatrix(int[][] template, double ratio) {
        int n = template.length;
        int[][] result = new int[n][n];
        for (int i = 0; i < n; i++) {
            for (int j = 0; j < n; j++) {
                if (template[i][j] == 0) {
                    result[i][j] = 0;
                    continue;
                }
                double noise = 1.0 + (rng.nextDouble() * 2 - 1) * ratio;
                result[i][j] = Math.max(1, (int) Math.round(template[i][j] * noise));
            }
        }
        return result;
    }
}
