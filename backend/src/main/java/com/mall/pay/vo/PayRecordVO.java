package com.mall.pay.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 支付记录视图对象
 */
@Data
public class PayRecordVO {
    private Long id;
    private Long orderId;
    private String payNo;
    private String channel;
    private BigDecimal payAmount;
    private Integer payStatus;
    private String thirdPayNo;
    private LocalDateTime gmtCreate;
    private LocalDateTime gmtModified;
}
