package com.mall.pay.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 创建支付请求
 */
@Data
public class CreatePayRequest {
    @NotNull(message = "订单ID不能为空")
    private Long orderId;

    @NotNull(message = "支付渠道不能为空")
    private String channel;
}
