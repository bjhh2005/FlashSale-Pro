package com.flashsale.flashsale_pro.service;

import com.flashsale.flashsale_pro.entity.UserBehaviorEvent;
import com.flashsale.flashsale_pro.entity.UserFeatureMatrix;

import java.util.List;

public interface UserBehaviorService {

    UserBehaviorEvent recordEvent(UserBehaviorEvent event);

    List<UserBehaviorEvent> getUserEvents(Long userId, int limit);

    List<UserBehaviorEvent> getUserEventsByAction(Long userId, String action, int limit);

    UserFeatureMatrix computeFeatureMatrix(Long userId, Long eventId);

    UserFeatureMatrix getFeatureMatrix(Long userId);

    UserFeatureMatrix getFeatureMatrixByEvent(Long userId, Long eventId);
}
