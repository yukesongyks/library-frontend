package com.mall.pay.entity;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 退款记录表
 */
@Data
public class RefundRecordDO {
    /**
     * 系统自增主键
     */
    private Long id;

    /**
     * 订单ID
     */
    private Long orderId;

    /**
     * 支付记录ID
     */
    private Long payRecordId;

    /**
     * 退款流水号
     */
    private String refundNo;

    /**
     * 退款金额
     */
    private BigDecimal refundAmount;

    /**
     * 退款状态
     */
    private Integer refundStatus;

    /**
     * 退款原因
     */
    private String reason;

    /**
     * 第三方退款流水号
     */
    private String thirdRefundNo;

    /**
     * 创建时间
     */
    private LocalDateTime gmtCreate;

    /**
     * 修改时间
     */
    private LocalDateTime gmtModified;
}
