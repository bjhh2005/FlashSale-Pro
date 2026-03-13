package com.flashsale.flashsale_pro.service;

import com.flashsale.flashsale_pro.entity.Product;

import java.util.List;

public interface ProductService {

    Product create(Product product);

    Product update(Product product);

    void delete(Long id);

    Product getById(Long id);

    List<Product> listAll();
}

