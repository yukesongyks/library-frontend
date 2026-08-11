package com.mall.order.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 订单商品项视图对象
 */
@Data
public class OrderItemVO {
    private Long id;
    private Long orderId;
    private Long skuId;
    private String skuName;
    private BigDecimal skuPrice;
    private Integer quantity;
    private BigDecimal subtotal;
    private LocalDateTime gmtCreate;
}
