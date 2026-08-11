package com.mall.pay.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

/**
 * 退款请求
 */
@Data
public class RefundRequest {
    @NotNull(message = "订单ID不能为空")
    private Long orderId;

    @NotNull(message = "退款金额不能为空")
    private BigDecimal amount;

    private String reason;
}
