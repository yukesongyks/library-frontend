package com.mall.pay.entity;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 支付记录表
 */
@Data
public class PayRecordDO {
    /**
     * 系统自增主键
     */
    private Long id;

    /**
     * 订单ID
     */
    private Long orderId;

    /**
     * 支付流水号
     */
    private String payNo;

    /**
     * 支付渠道：alipay/wechat
     */
    private String channel;

    /**
     * 支付金额
     */
    private BigDecimal payAmount;

    /**
     * 支付状态
     */
    private Integer payStatus;

    /**
     * 第三方支付流水号
     */
    private String thirdPayNo;

    /**
     * 第三方响应内容
     */
    private String thirdResp;

    /**
     * 创建时间
     */
    private LocalDateTime gmtCreate;

    /**
     * 修改时间
     */
    private LocalDateTime gmtModified;
}
