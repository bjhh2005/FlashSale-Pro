package com.flashsale.flashsale_pro.service.impl;

import com.flashsale.flashsale_pro.entity.UserBehaviorEvent;
import com.flashsale.flashsale_pro.entity.UserFeatureMatrix;
import com.flashsale.flashsale_pro.mapper.UserBehaviorEventMapper;
import com.flashsale.flashsale_pro.mapper.UserFeatureMatrixMapper;
import com.flashsale.flashsale_pro.service.UserBehaviorService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Service
public class UserBehaviorServiceImpl implements UserBehaviorService {

    @Autowired
    private UserBehaviorEventMapper behaviorEventMapper;

    @Autowired
    private UserFeatureMatrixMapper featureMatrixMapper;

    @Autowired(required = false)
    private StringRedisTemplate stringRedisTemplate;

    private static final String MATRIX_KEY_PREFIX = "flashsale:bi:matrix:";
    private static final String LAST_STATE_KEY_PREFIX = "flashsale:bi:last-state:";
    private static final long MATRIX_TTL_HOURS = 24;

    @Override
    public UserBehaviorEvent recordEvent(UserBehaviorEvent event) {
        behaviorEventMapper.insert(event);
        updateEntropyMatrix(event);
        return event;
    }

    @Override
    public List<UserBehaviorEvent> getUserEvents(Long userId, int limit) {
        return behaviorEventMapper.findByUserId(userId, limit);
    }

    @Override
    public List<UserBehaviorEvent> getUserEventsByAction(Long userId, String action, int limit) {
        return behaviorEventMapper.findByUserIdAndAction(userId, action, limit);
    }

    @Override
    public UserFeatureMatrix computeFeatureMatrix(Long userId, Long eventId) {
        List<UserBehaviorEvent> events = behaviorEventMapper.findByUserId(userId, 10000);

        int clickCount = 0, favoriteCount = 0, addToCartCount = 0;
        int browseCount = 0, shareCount = 0, purchaseCount = 0;
        long totalDwellSeconds = 0;
        int dwellEventCount = 0;

        OffsetDateTime sevenDaysAgo = OffsetDateTime.now().minusDays(7);
        OffsetDateTime oneDayAgo = OffsetDateTime.now().minusDays(1);
        int recent7d = 0, recent1d = 0;

        long[] productIds = events.stream()
                .filter(e -> e.getProductId() != null)
                .mapToLong(UserBehaviorEvent::getProductId)
                .distinct()
                .toArray();

        double decaySum = 0.0;
        OffsetDateTime now = OffsetDateTime.now();

        for (UserBehaviorEvent e : events) {
            String action = e.getAction();
            if (action == null) continue;

            switch (action) {
                case "CLICK" -> clickCount++;
                case "FAVORITE" -> favoriteCount++;
                case "ADD_TO_CART" -> addToCartCount++;
                case "BROWSE" -> browseCount++;
                case "SHARE" -> shareCount++;
                case "PURCHASE" -> purchaseCount++;
            }

            if (e.getDwellSeconds() != null && e.getDwellSeconds() > 0) {
                totalDwellSeconds += e.getDwellSeconds();
                dwellEventCount++;
            }

            if (e.getCreatedAt() != null) {
                if (!e.getCreatedAt().isBefore(sevenDaysAgo)) recent7d++;
                if (!e.getCreatedAt().isBefore(oneDayAgo)) recent1d++;

                double daysDiff = (now.toEpochSecond() - e.getCreatedAt().toEpochSecond()) / 86400.0;
                double weight = switch (action) {
                    case "PURCHASE" -> 5.0;
                    case "ADD_TO_CART" -> 3.0;
                    case "FAVORITE" -> 2.5;
                    case "SHARE" -> 2.0;
                    case "CLICK" -> 1.0;
                    default -> 0.5;
                };
                decaySum += weight * Math.exp(-0.1 * daysDiff);
            }
        }

        BigDecimal avgDwell = dwellEventCount > 0
                ? BigDecimal.valueOf(totalDwellSeconds).divide(BigDecimal.valueOf(dwellEventCount), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        UserFeatureMatrix matrix = featureMatrixMapper.findByUserId(userId);
        boolean isUpdate = matrix != null;
        if (matrix == null) {
            matrix = new UserFeatureMatrix();
            matrix.setUserId(userId);
        }

        matrix.setEventId(eventId);
        matrix.setClickCount(clickCount);
        matrix.setFavoriteCount(favoriteCount);
        matrix.setAddToCartCount(addToCartCount);
        matrix.setBrowseCount(browseCount);
        matrix.setShareCount(shareCount);
        matrix.setPurchaseCount(purchaseCount);
        matrix.setAvgDwellSeconds(avgDwell);
        matrix.setRecent7dActionCount(recent7d);
        matrix.setRecent1dActionCount(recent1d);
        matrix.setActionDecayScore(BigDecimal.valueOf(decaySum).setScale(4, RoundingMode.HALF_UP));
        matrix.setCrossProductCount(productIds.length);

        if (isUpdate) {
            featureMatrixMapper.update(matrix);
        } else {
            featureMatrixMapper.insert(matrix);
        }

        return matrix;
    }

    @Override
    public UserFeatureMatrix getFeatureMatrix(Long userId) {
        return featureMatrixMapper.findByUserId(userId);
    }

    @Override
    public UserFeatureMatrix getFeatureMatrixByEvent(Long userId, Long eventId) {
        return featureMatrixMapper.findByUserIdAndEventId(userId, eventId);
    }

    private void updateEntropyMatrix(UserBehaviorEvent event) {
        if (stringRedisTemplate == null || event.getUserId() == null || event.getAction() == null) {
            return;
        }

        String currentState = toEntropyState(event.getAction());
        if (currentState == null) {
            return;
        }

        String userId = String.valueOf(event.getUserId());
        String lastStateKey = LAST_STATE_KEY_PREFIX + userId;
        String previousState = stringRedisTemplate.opsForValue().get(lastStateKey);

        if (previousState != null && isEntropyState(previousState)) {
            String matrixKey = MATRIX_KEY_PREFIX + userId + ":" + previousState + ":" + currentState;
            stringRedisTemplate.opsForValue().increment(matrixKey);
            stringRedisTemplate.expire(matrixKey, MATRIX_TTL_HOURS, TimeUnit.HOURS);
        }

        stringRedisTemplate.opsForValue().set(lastStateKey, currentState, MATRIX_TTL_HOURS, TimeUnit.HOURS);
    }

    private String toEntropyState(String action) {
        return switch (action) {
            case "CLICK", "BROWSE" -> "DETAIL";
            case "FAVORITE" -> "FAV";
            case "ADD_TO_CART" -> "CART";
            case "PURCHASE" -> "SECKILL";
            default -> null;
        };
    }

    private boolean isEntropyState(String state) {
        return "DETAIL".equals(state)
                || "FAV".equals(state)
                || "CART".equals(state)
                || "SECKILL".equals(state);
    }
}
