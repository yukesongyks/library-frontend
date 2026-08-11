package com.mall.product.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * SKU视图对象
 */
@Data
public class SkuInfoVO {
    private Long id;
    private Long productId;
    private String skuName;
    private BigDecimal skuPrice;
    private Integer skuStock;
    private String skuImage;
    private LocalDateTime gmtCreate;
    private LocalDateTime gmtModified;
}
