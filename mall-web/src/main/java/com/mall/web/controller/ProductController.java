package com.mall.web.controller;

import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mall.api.entity.Product;
import com.mall.common.result.PageResult;
import com.mall.common.result.Result;
import com.mall.service.ProductService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/product")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping("/list")
    public Result<PageResult<Product>> listProducts(
            @RequestParam(defaultValue = "1") int pageNum,
            @RequestParam(defaultValue = "10") int pageSize,
            @RequestParam(required = false) Long categoryId) {
        Page<Product> page = productService.listProducts(pageNum, pageSize, categoryId);
        return Result.success(PageResult.of(page.getTotal(), pageNum, pageSize, page.getRecords()));
    }

    @GetMapping("/detail/{id}")
    public Result<Product> getProductDetail(@PathVariable Long id) {
        return Result.success(productService.getProductDetail(id));
    }

    @GetMapping("/search")
    public Result<List<Product>> searchProducts(@RequestParam String keyword) {
        return Result.success(List.of());
    }
}
