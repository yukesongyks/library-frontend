package com.mall.pay.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 退款记录视图对象
 */
@Data
public class RefundRecordVO {
    private Long id;
    private Long orderId;
    private Long payRecordId;
    private String refundNo;
    private BigDecimal refundAmount;
    private Integer refundStatus;
    private String reason;
    private String thirdRefundNo;
    private LocalDateTime gmtCreate;
    private LocalDateTime gmtModified;
}
