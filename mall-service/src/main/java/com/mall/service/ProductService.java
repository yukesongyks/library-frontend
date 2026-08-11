package com.mall.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.baomidou.mybatisplus.extension.plugins.pagination.Page;
import com.mall.api.entity.Product;
import com.mall.api.entity.SkuInfo;
import com.mall.common.enums.ProductStatus;
import com.mall.dao.mapper.ProductMapper;
import com.mall.dao.mapper.SkuInfoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductMapper productMapper;
    private final SkuInfoMapper skuInfoMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String PRODUCT_LIST_KEY = "product:list:";
    private static final String PRODUCT_DETAIL_KEY = "product:detail:";
    private static final long CACHE_TTL = 300;

    public Page<Product> listProducts(int pageNum, int pageSize, Long categoryId) {
        String cacheKey = PRODUCT_LIST_KEY + pageNum + ":" + pageSize + ":" + categoryId;
        Page<Product> cached = (Page<Product>) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }
        LambdaQueryWrapper<Product> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(Product::getProductStatus, ProductStatus.ON_SHELF.getCode());
        if (categoryId != null) {
            wrapper.eq(Product::getCategoryId, categoryId);
        }
        Page<Product> page = new Page<>(pageNum, pageSize);
        Page<Product> result = productMapper.selectPage(page, wrapper);
        redisTemplate.opsForValue().set(cacheKey, result, CACHE_TTL, TimeUnit.SECONDS);
        return result;
    }

    public Product getProductDetail(Long id) {
        String cacheKey = PRODUCT_DETAIL_KEY + id;
        Product cached = (Product) redisTemplate.opsForValue().get(cacheKey);
        if (cached != null) {
            return cached;
        }
        Product product = productMapper.selectById(id);
        if (product != null) {
            redisTemplate.opsForValue().set(cacheKey, product, CACHE_TTL, TimeUnit.SECONDS);
        }
        return product;
    }

    public List<SkuInfo> getSkuListByProductId(Long productId) {
        LambdaQueryWrapper<SkuInfo> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(SkuInfo::getProductId, productId);
        return skuInfoMapper.selectList(wrapper);
    }
}
