package com.flashsale.flashsale_pro.service;

import com.flashsale.flashsale_pro.entity.UserBehaviorEvent;
import com.flashsale.flashsale_pro.entity.UserFeatureMatrix;
import com.flashsale.flashsale_pro.mapper.UserBehaviorEventMapper;
import com.flashsale.flashsale_pro.mapper.UserFeatureMatrixMapper;
import com.flashsale.flashsale_pro.service.impl.UserBehaviorServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;

@ExtendWith(MockitoExtension.class)
class UserBehaviorServiceImplTest {

    @Mock
    private UserBehaviorEventMapper behaviorEventMapper;

    @Mock
    private UserFeatureMatrixMapper featureMatrixMapper;

    @InjectMocks
    private UserBehaviorServiceImpl userBehaviorService;

    @Test
    void recordEvent_shouldInsertAndReturnEvent() {
        UserBehaviorEvent event = new UserBehaviorEvent();
        event.setUserId(1L);
        event.setProductId(10L);
        event.setAction("CLICK");

        given(behaviorEventMapper.insert(any(UserBehaviorEvent.class))).willAnswer(inv -> {
            UserBehaviorEvent arg = inv.getArgument(0);
            arg.setId(1L);
            return (Void) null;
        });

        UserBehaviorEvent result = userBehaviorService.recordEvent(event);
        assertThat(result.getId()).isEqualTo(1L);
        assertThat(result.getUserId()).isEqualTo(1L);
        assertThat(result.getAction()).isEqualTo("CLICK");
    }

    @Test
    void getUserEvents_shouldDelegateToMapper() {
        UserBehaviorEvent e1 = new UserBehaviorEvent();
        e1.setId(1L);
        e1.setUserId(1L);
        given(behaviorEventMapper.findByUserId(1L, 100)).willReturn(List.of(e1));

        List<UserBehaviorEvent> result = userBehaviorService.getUserEvents(1L, 100);
        assertThat(result).hasSize(1);
        assertThat(result.get(0).getId()).isEqualTo(1L);
    }

    @Test
    void getUserEventsByAction_shouldDelegateToMapper() {
        given(behaviorEventMapper.findByUserIdAndAction(1L, "CLICK", 50)).willReturn(List.of());

        List<UserBehaviorEvent> result = userBehaviorService.getUserEventsByAction(1L, "CLICK", 50);
        assertThat(result).isEmpty();
    }

    @Test
    void getFeatureMatrix_shouldReturnFromMapper() {
        UserFeatureMatrix matrix = new UserFeatureMatrix();
        matrix.setUserId(1L);
        matrix.setClickCount(10);
        given(featureMatrixMapper.findByUserId(1L)).willReturn(matrix);

        UserFeatureMatrix result = userBehaviorService.getFeatureMatrix(1L);
        assertThat(result).isNotNull();
        assertThat(result.getUserId()).isEqualTo(1L);
        assertThat(result.getClickCount()).isEqualTo(10);
    }

    @Test
    void getFeatureMatrix_shouldReturnNullWhenNotFound() {
        given(featureMatrixMapper.findByUserId(999L)).willReturn(null);
        assertThat(userBehaviorService.getFeatureMatrix(999L)).isNull();
    }

    @Test
    void computeFeatureMatrix_shouldCreateNewMatrixWhenNoneExists() {
        UserBehaviorEvent click = new UserBehaviorEvent();
        click.setUserId(1L);
        click.setAction("CLICK");
        click.setProductId(10L);
        click.setCreatedAt(OffsetDateTime.now());

        UserBehaviorEvent browse = new UserBehaviorEvent();
        browse.setUserId(1L);
        browse.setAction("BROWSE");
        browse.setProductId(10L);
        browse.setDwellSeconds(120);
        browse.setCreatedAt(OffsetDateTime.now());

        UserBehaviorEvent fav = new UserBehaviorEvent();
        fav.setUserId(1L);
        fav.setAction("FAVORITE");
        fav.setProductId(20L);
        fav.setCreatedAt(OffsetDateTime.now());

        given(behaviorEventMapper.findByUserId(1L, 10000)).willReturn(List.of(click, browse, fav));
        given(featureMatrixMapper.findByUserId(1L)).willReturn(null);
        given(featureMatrixMapper.insert(any(UserFeatureMatrix.class))).willAnswer(inv -> {
            UserFeatureMatrix m = inv.getArgument(0);
            m.setId(1L);
            return (Void) null;
        });

        UserFeatureMatrix result = userBehaviorService.computeFeatureMatrix(1L, 100L);

        assertThat(result).isNotNull();
        assertThat(result.getClickCount()).isEqualTo(1);
        assertThat(result.getBrowseCount()).isEqualTo(1);
        assertThat(result.getFavoriteCount()).isEqualTo(1);
        assertThat(result.getCrossProductCount()).isEqualTo(2);
        then(featureMatrixMapper).should().insert(any(UserFeatureMatrix.class));
        then(featureMatrixMapper).shouldHaveNoMoreInteractions();
    }

    @Test
    void computeFeatureMatrix_shouldUpdateWhenMatrixExists() {
        UserBehaviorEvent cart = new UserBehaviorEvent();
        cart.setUserId(1L);
        cart.setAction("ADD_TO_CART");
        cart.setProductId(10L);
        cart.setCreatedAt(OffsetDateTime.now());

        UserFeatureMatrix existing = new UserFeatureMatrix();
        existing.setId(5L);
        existing.setUserId(1L);

        given(behaviorEventMapper.findByUserId(1L, 10000)).willReturn(List.of(cart));
        given(featureMatrixMapper.findByUserId(1L)).willReturn(existing);

        UserFeatureMatrix result = userBehaviorService.computeFeatureMatrix(1L, null);

        assertThat(result.getAddToCartCount()).isEqualTo(1);
        then(featureMatrixMapper).should().update(any(UserFeatureMatrix.class));
        then(featureMatrixMapper).shouldHaveNoMoreInteractions();
    }
}
