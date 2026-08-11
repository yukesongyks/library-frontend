package com.mall.product.entity;

import com.mall.common.enums.ProductStatus;
import lombok.Data;

import java.time.LocalDateTime;

/**
 * 商品主表
 */
@Data
public class ProductDO {
    /**
     * 系统自增主键
     */
    private Long id;

    /**
     * 商品名称
     */
    private String productName;

    /**
     * 商品描述
     */
    private String productDesc;

    /**
     * 分类ID
     */
    private Long categoryId;

    /**
     * 商品状态：1-上架 2-下架
     */
    private Integer productStatus;

    /**
     * 商品主图URL
     */
    private String productImage;

    /**
     * 创建时间
     */
    private LocalDateTime gmtCreate;

    /**
     * 修改时间
     */
    private LocalDateTime gmtModified;
}
