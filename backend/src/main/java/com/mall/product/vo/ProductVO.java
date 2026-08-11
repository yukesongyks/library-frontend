package com.mall.product.vo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 商品视图对象
 */
@Data
public class ProductVO {
    private Long id;
    private String productName;
    private String productDesc;
    private Long categoryId;
    private Integer productStatus;
    private String productImage;
    private LocalDateTime gmtCreate;
    private LocalDateTime gmtModified;
}
