package com.mall.cart.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 购物车表
 */
@Data
public class CartItemDO {
    /**
     * 系统自增主键
     */
    private Long id;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * SKU ID
     */
    private Long skuId;

    /**
     * 商品数量
     */
    private Integer quantity;

    /**
     * 创建时间
     */
    private LocalDateTime gmtCreate;

    /**
     * 修改时间
     */
    private LocalDateTime gmtModified;
}
