package com.flashsale.flashsale_pro.service;

import com.flashsale.flashsale_pro.entity.FlashSaleItem;
import com.flashsale.flashsale_pro.entity.FlashSaleOrder;
import com.flashsale.flashsale_pro.mapper.FlashSaleItemMapper;
import com.flashsale.flashsale_pro.mapper.FlashSaleOrderMapper;
import com.flashsale.flashsale_pro.service.impl.FlashSaleOrderServiceImpl;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.BDDMockito.given;
import static org.mockito.BDDMockito.then;

@ExtendWith(MockitoExtension.class)
class FlashSaleOrderServiceImplTest {

    @Mock
    private FlashSaleItemMapper flashSaleItemMapper;

    @Mock
    private FlashSaleOrderMapper flashSaleOrderMapper;

    @InjectMocks
    private FlashSaleOrderServiceImpl flashSaleOrderService;

    @Test
    void createOrder_shouldNormalizeQuantityAndCreateOrderWhenStockEnough() {
        Long userId = 1L;
        Long itemId = 2L;
        Integer quantity = null; // 将被归一化为 1

        FlashSaleItem item = new FlashSaleItem();
        item.setId(itemId);
        item.setEventId(3L);
        item.setProductId(4L);
        item.setAvailableStock(10);
        item.setFlashPrice(new BigDecimal("99.00"));

        given(flashSaleOrderMapper.findByUserAndItem(userId, itemId)).willReturn(null);
        given(flashSaleItemMapper.findById(itemId)).willReturn(item);
        given(flashSaleItemMapper.decreaseStock(itemId, 1)).willReturn(1);

        given(flashSaleOrderMapper.insert(any(FlashSaleOrder.class))).willAnswer(invocation -> {
            FlashSaleOrder arg = invocation.getArgument(0);
            arg.setId(100L);
            return 100L;
        });

        given(flashSaleOrderMapper.findById(100L)).willAnswer(invocation -> {
            FlashSaleOrder persisted = new FlashSaleOrder();
            persisted.setId(100L);
            persisted.setUserId(userId);
            persisted.setEventId(item.getEventId());
            persisted.setItemId(itemId);
            persisted.setProductId(item.getProductId());
            persisted.setQuantity(1);
            persisted.setOrderStatus("PENDING_PAYMENT");
            persisted.setTotalAmount(new BigDecimal("99.00"));
            return persisted;
        });

        FlashSaleOrder order = flashSaleOrderService.createOrder(userId, itemId, quantity);

        assertThat(order.getId()).isEqualTo(100L);
        assertThat(order.getUserId()).isEqualTo(userId);
        assertThat(order.getItemId()).isEqualTo(itemId);
        assertThat(order.getQuantity()).isEqualTo(1);
        assertThat(order.getTotalAmount()).isEqualByComparingTo("99.00");
        assertThat(order.getOrderStatus()).isEqualTo("PENDING_PAYMENT");
    }

    @Test
    void createOrder_shouldReturnExistingOrderWhenUserAlreadyOrderedSameItem() {
        Long userId = 1L;
        Long itemId = 2L;

        FlashSaleOrder existing = new FlashSaleOrder();
        existing.setId(200L);

        given(flashSaleOrderMapper.findByUserAndItem(userId, itemId)).willReturn(existing);

        FlashSaleOrder order = flashSaleOrderService.createOrder(userId, itemId, 1);

        assertThat(order).isSameAs(existing);
        then(flashSaleItemMapper).shouldHaveNoInteractions();
    }

    @Test
    void createOrder_shouldThrowWhenItemNotFound() {
        given(flashSaleOrderMapper.findByUserAndItem(1L, 2L)).willReturn(null);
        given(flashSaleItemMapper.findById(2L)).willReturn(null);

        assertThatThrownBy(() -> flashSaleOrderService.createOrder(1L, 2L, 1))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("秒杀商品不存在");
    }

    @Test
    void createOrder_shouldThrowWhenStockNotEnough() {
        FlashSaleItem item = new FlashSaleItem();
        item.setId(2L);
        item.setAvailableStock(1);

        given(flashSaleOrderMapper.findByUserAndItem(1L, 2L)).willReturn(null);
        given(flashSaleItemMapper.findById(2L)).willReturn(item);

        assertThatThrownBy(() -> flashSaleOrderService.createOrder(1L, 2L, 5))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("库存不足");
    }

    @Test
    void createOrder_shouldThrowWhenDecreaseStockFailed() {
        FlashSaleItem item = new FlashSaleItem();
        item.setId(2L);
        item.setAvailableStock(10);
        item.setFlashPrice(new BigDecimal("99.00"));
        item.setEventId(3L);
        item.setProductId(4L);

        given(flashSaleOrderMapper.findByUserAndItem(1L, 2L)).willReturn(null);
        given(flashSaleItemMapper.findById(2L)).willReturn(item);
        given(flashSaleItemMapper.decreaseStock(2L, 1)).willReturn(0);

        assertThatThrownBy(() -> flashSaleOrderService.createOrder(1L, 2L, 1))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("库存扣减失败");
    }

    @Test
    void listUserOrders_shouldDelegateToMapper() {
        FlashSaleOrder order = new FlashSaleOrder();
        given(flashSaleOrderMapper.findByUserId(1L)).willReturn(List.of(order));

        List<FlashSaleOrder> list = flashSaleOrderService.listUserOrders(1L);

        assertThat(list).containsExactly(order);
    }

    @Test
    void markOrderPaid_shouldThrowWhenUpdateAffectedNoRows() {
        given(flashSaleOrderMapper.markPaid(1L)).willReturn(0);

        assertThatThrownBy(() -> flashSaleOrderService.markOrderPaid(1L))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("订单状态更新失败");
    }

    @Test
    void markOrderPaid_shouldReturnUpdatedOrderWhenSuccess() {
        FlashSaleOrder order = new FlashSaleOrder();
        order.setId(1L);

        given(flashSaleOrderMapper.markPaid(1L)).willReturn(1);
        given(flashSaleOrderMapper.findById(1L)).willReturn(order);

        FlashSaleOrder result = flashSaleOrderService.markOrderPaid(1L);

        assertThat(result).isSameAs(order);
        then(flashSaleOrderMapper).should().markPaid(eq(1L));
        then(flashSaleOrderMapper).should().findById(1L);
    }
}

