package com.mall.product.entity;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 商品SKU表
 */
@Data
public class SkuInfoDO {
    /**
     * 系统自增主键
     */
    private Long id;

    /**
     * 商品ID
     */
    private Long productId;

    /**
     * SKU名称（如：红色-XXL）
     */
    private String skuName;

    /**
     * SKU售价
     */
    private BigDecimal skuPrice;

    /**
     * 库存数量
     */
    private Integer skuStock;

    /**
     * SKU图片URL
     */
    private String skuImage;

    /**
     * 创建时间
     */
    private LocalDateTime gmtCreate;

    /**
     * 修改时间
     */
    private LocalDateTime gmtModified;
}
