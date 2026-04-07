package com.flashsale.flashsale_pro.controller;

import com.flashsale.flashsale_pro.common.Result;
import com.flashsale.flashsale_pro.entity.Product;
import com.flashsale.flashsale_pro.service.ProductService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/product")
public class AdminProductController {

    @Autowired
    private ProductService productService;

    @PostMapping
    public Result<Product> create(@RequestBody Product product) {
        return Result.success(productService.create(product));
    }

    @PutMapping("/{id}")
    public Result<Product> update(@PathVariable Long id, @RequestBody Product product) {
        product.setId(id);
        return Result.success(productService.update(product));
    }

    @DeleteMapping("/{id}")
    public Result<Void> delete(@PathVariable Long id) {
        productService.delete(id);
        return Result.success();
    }

    @GetMapping("/{id}")
    public Result<Product> get(@PathVariable Long id) {
        return Result.success(productService.getById(id));
    }

    @GetMapping
    public Result<List<Product>> list() {
        return Result.success(productService.listAll());
    }
}

