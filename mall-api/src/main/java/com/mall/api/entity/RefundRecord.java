package com.mall.api.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("refund_record")
public class RefundRecord {
    @TableId(type = IdType.AUTO)
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
