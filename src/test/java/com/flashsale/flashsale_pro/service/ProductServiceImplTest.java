package com.flashsale.flashsale_pro.service;

import com.flashsale.flashsale_pro.entity.Product;
import com.flashsale.flashsale_pro.mapper.ProductMapper;
import com.flashsale.flashsale_pro.service.impl.ProductServiceImpl;
import org.junit.jupiter.api.BeforeEach;
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
class ProductServiceImplTest {

    @Mock
    private ProductMapper productMapper;

    @InjectMocks
    private ProductServiceImpl productService;

    private Product product;

    @BeforeEach
    void setUp() {
        product = new Product();
        product.setName("iPhone");
        product.setDescription("Phone");
        product.setOriginalPrice(new BigDecimal("6999.00"));
    }

    @Test
    void create_shouldFillDefaultStatusAndReturnPersistedEntity() {
        product.setStatus(null);

        given(productMapper.insert(any(Product.class))).willAnswer(invocation -> {
            Product arg = invocation.getArgument(0);
            arg.setId(1L);
            return 1L;
        });
        given(productMapper.findById(1L)).willAnswer(invocation -> {
            Product persisted = new Product();
            persisted.setId(1L);
            persisted.setName(product.getName());
            persisted.setDescription(product.getDescription());
            persisted.setOriginalPrice(product.getOriginalPrice());
            persisted.setStatus("AVAILABLE");
            return persisted;
        });

        Product created = productService.create(product);

        assertThat(created.getId()).isEqualTo(1L);
        assertThat(created.getStatus()).isEqualTo("AVAILABLE");
        then(productMapper).should().insert(any(Product.class));
        then(productMapper).should().findById(1L);
    }

    @Test
    void update_shouldDelegateToMapperAndReturnFreshEntity() {
        product.setId(2L);

        given(productMapper.findById(2L)).willReturn(product);

        Product updated = productService.update(product);

        then(productMapper).should().update(eq(product));
        then(productMapper).should().findById(2L);
        assertThat(updated).isSameAs(product);
    }

    @Test
    void delete_shouldDelegateToMapper() {
        productService.delete(3L);

        then(productMapper).should().deleteById(3L);
    }

    @Test
    void getById_shouldDelegateToMapper() {
        given(productMapper.findById(4L)).willReturn(product);

        Product found = productService.getById(4L);

        assertThat(found).isSameAs(product);
    }

    @Test
    void listAll_shouldDelegateToMapper() {
        given(productMapper.findAll()).willReturn(List.of(product));

        List<Product> all = productService.listAll();

        assertThat(all).containsExactly(product);
    }
}

