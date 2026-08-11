package com.mall.api.request;

import lombok.Data;

import java.math.BigDecimal;

@Data
public class RefundRequest {
    private Long orderId;
    private BigDecimal amount;
    private String reason;
}
