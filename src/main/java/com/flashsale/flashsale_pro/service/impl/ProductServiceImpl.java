package com.flashsale.flashsale_pro.service.impl;

import com.flashsale.flashsale_pro.entity.Product;
import com.flashsale.flashsale_pro.mapper.ProductMapper;
import com.flashsale.flashsale_pro.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class ProductServiceImpl implements ProductService {

    @Autowired
    private ProductMapper productMapper;

    @Override
    public Product create(Product product) {
        if (product.getStatus() == null) {
            product.setStatus("AVAILABLE");
        }
        productMapper.insert(product);
        return productMapper.findById(product.getId());
    }

    @Override
    public Product update(Product product) {
        productMapper.update(product);
        return productMapper.findById(product.getId());
    }

    @Override
    public void delete(Long id) {
        productMapper.deleteById(id);
    }

    @Override
    public Product getById(Long id) {
        return productMapper.findById(id);
    }

    @Override
    public List<Product> listAll() {
        return productMapper.findAll();
    }
}

