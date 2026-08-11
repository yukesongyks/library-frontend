package com.mall.cart.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 购物车项视图对象
 */
@Data
public class CartItemVO {
    private Long id;
    private Long userId;
    private Long skuId;
    private String skuName;
    private BigDecimal skuPrice;
    private Integer quantity;
    private BigDecimal subtotal;
    private LocalDateTime gmtCreate;
    private LocalDateTime gmtModified;
}
