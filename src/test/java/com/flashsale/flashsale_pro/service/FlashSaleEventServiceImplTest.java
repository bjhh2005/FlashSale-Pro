package com.flashsale.flashsale_pro.service;

import com.flashsale.flashsale_pro.entity.FlashSaleEvent;
import com.flashsale.flashsale_pro.mapper.FlashSaleEventMapper;
import com.flashsale.flashsale_pro.service.impl.FlashSaleEventServiceImpl;
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
class FlashSaleEventServiceImplTest {

    @Mock
    private FlashSaleEventMapper flashSaleEventMapper;

    @InjectMocks
    private FlashSaleEventServiceImpl flashSaleEventService;

    @Test
    void create_shouldFillDefaultStatusWhenNull() {
        FlashSaleEvent event = new FlashSaleEvent();
        event.setName("双11大促");
        event.setStartTime(OffsetDateTime.now());
        event.setEndTime(OffsetDateTime.now().plusHours(2));

        given(flashSaleEventMapper.insert(any(FlashSaleEvent.class))).willAnswer(invocation -> {
            FlashSaleEvent arg = invocation.getArgument(0);
            arg.setId(10L);
            return 10L;
        });

        given(flashSaleEventMapper.findById(10L)).willAnswer(invocation -> {
            FlashSaleEvent persisted = new FlashSaleEvent();
            persisted.setId(10L);
            persisted.setName(event.getName());
            persisted.setStartTime(event.getStartTime());
            persisted.setEndTime(event.getEndTime());
            persisted.setStatus("DRAFT");
            return persisted;
        });

        FlashSaleEvent created = flashSaleEventService.create(event);

        assertThat(created.getId()).isEqualTo(10L);
        assertThat(created.getStatus()).isEqualTo("DRAFT");
        then(flashSaleEventMapper).should().insert(any(FlashSaleEvent.class));
        then(flashSaleEventMapper).should().findById(10L);
    }

    @Test
    void update_shouldDelegateToMapperAndReturnFreshEntity() {
        FlashSaleEvent event = new FlashSaleEvent();
        event.setId(20L);
        event.setName("活动");

        given(flashSaleEventMapper.findById(20L)).willReturn(event);

        FlashSaleEvent updated = flashSaleEventService.update(event);

        then(flashSaleEventMapper).should().update(eq(event));
        then(flashSaleEventMapper).should().findById(20L);
        assertThat(updated).isSameAs(event);
    }

    @Test
    void delete_shouldDelegateToMapper() {
        flashSaleEventService.delete(30L);

        then(flashSaleEventMapper).should().deleteById(30L);
    }

    @Test
    void getById_shouldDelegateToMapper() {
        FlashSaleEvent event = new FlashSaleEvent();
        given(flashSaleEventMapper.findById(40L)).willReturn(event);

        FlashSaleEvent found = flashSaleEventService.getById(40L);

        assertThat(found).isSameAs(event);
    }

    @Test
    void listAll_shouldDelegateToMapper() {
        FlashSaleEvent event = new FlashSaleEvent();
        given(flashSaleEventMapper.findAll()).willReturn(List.of(event));

        List<FlashSaleEvent> all = flashSaleEventService.listAll();

        assertThat(all).containsExactly(event);
    }
}

