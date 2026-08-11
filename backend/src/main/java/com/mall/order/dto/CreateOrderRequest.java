package com.mall.order.dto;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.List;

/**
 * 创建订单请求
 */
@Data
public class CreateOrderRequest {
    @NotEmpty(message = "购物车项不能为空")
    private List<Long> cartItemIds;

    @NotNull(message = "收货地址ID不能为空")
    private Long addressId;

    private String remark;
}
