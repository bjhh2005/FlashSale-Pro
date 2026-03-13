package com.flashsale.flashsale_pro.service;

import com.flashsale.flashsale_pro.entity.FlashSaleItem;
import com.flashsale.flashsale_pro.mapper.FlashSaleItemMapper;
import com.flashsale.flashsale_pro.service.impl.FlashSaleItemServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;

@ExtendWith(MockitoExtension.class)
class FlashSaleItemServiceImplTest {

    @Mock
    private FlashSaleItemMapper flashSaleItemMapper;

    @InjectMocks
    private FlashSaleItemServiceImpl flashSaleItemService;

    @Test
    void create_shouldFillDefaultsAndReturnPersistedEntity() {
        FlashSaleItem item = new FlashSaleItem();
        item.setEventId(1L);
        item.setProductId(2L);
        item.setFlashPrice(new BigDecimal("199.00"));
        item.setTotalStock(100);

        given(flashSaleItemMapper.insert(any(FlashSaleItem.class))).willAnswer(invocation -> {
            FlashSaleItem arg = invocation.getArgument(0);
            arg.setId(5L);
            return 5L;
        });

        given(flashSaleItemMapper.findById(5L)).willAnswer(invocation -> {
            FlashSaleItem persisted = new FlashSaleItem();
            persisted.setId(5L);
            persisted.setEventId(item.getEventId());
            persisted.setProductId(item.getProductId());
            persisted.setFlashPrice(item.getFlashPrice());
            persisted.setTotalStock(item.getTotalStock());
            persisted.setAvailableStock(100);
            persisted.setSoldCount(0);
            persisted.setPerUserLimit(1);
            persisted.setVersion(0);
            return persisted;
        });

        FlashSaleItem created = flashSaleItemService.create(item);

        assertThat(created.getId()).isEqualTo(5L);
        assertThat(created.getPerUserLimit()).isEqualTo(1);
        assertThat(created.getSoldCount()).isZero();
        assertThat(created.getAvailableStock()).isEqualTo(100);
        assertThat(created.getVersion()).isZero();

        then(flashSaleItemMapper).should().insert(any(FlashSaleItem.class));
        then(flashSaleItemMapper).should().findById(5L);
    }

    @Test
    void update_shouldDelegateToMapperAndReturnFreshEntity() {
        FlashSaleItem item = new FlashSaleItem();
        item.setId(6L);

        given(flashSaleItemMapper.findById(6L)).willReturn(item);

        FlashSaleItem updated = flashSaleItemService.update(item);

        then(flashSaleItemMapper).should().update(eq(item));
        then(flashSaleItemMapper).should().findById(6L);
        assertThat(updated).isSameAs(item);
    }

    @Test
    void delete_shouldDelegateToMapper() {
        flashSaleItemService.delete(7L);

        then(flashSaleItemMapper).should().deleteById(7L);
    }

    @Test
    void getById_shouldDelegateToMapper() {
        FlashSaleItem item = new FlashSaleItem();
        given(flashSaleItemMapper.findById(8L)).willReturn(item);

        FlashSaleItem found = flashSaleItemService.getById(8L);

        assertThat(found).isSameAs(item);
    }

    @Test
    void listByEventId_shouldDelegateToMapper() {
        FlashSaleItem item = new FlashSaleItem();
        given(flashSaleItemMapper.findByEventId(9L)).willReturn(List.of(item));

        List<FlashSaleItem> list = flashSaleItemService.listByEventId(9L);

        assertThat(list).containsExactly(item);
    }
}

