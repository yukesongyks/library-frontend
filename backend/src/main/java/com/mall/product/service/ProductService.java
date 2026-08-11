package com.mall.product.service;

import com.mall.product.dto.ProductListRequest;
import com.mall.product.entity.ProductDO;
import com.mall.product.entity.SkuInfoDO;

import java.util.List;

/**
 * 商品服务接口
 */
public interface ProductService {

    /**
     * 根据ID查询商品
     */
    ProductDO getProductById(Long id);

    /**
     * 分页查询商品列表
     */
    List<ProductDO> listProducts(ProductListRequest request);

    /**
     * 根据关键词搜索商品
     */
    List<ProductDO> searchProducts(String keyword);

    /**
     * 根据商品ID查询SKU列表
     */
    List<SkuInfoDO> listSkuByProductId(Long productId);

    /**
     * 根据SKU ID查询SKU
     */
    SkuInfoDO getSkuById(Long skuId);
}
