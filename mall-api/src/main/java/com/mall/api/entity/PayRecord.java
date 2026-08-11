package com.mall.api.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("pay_record")
public class PayRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long orderId;
    private String payNo;
    private String channel;
    private BigDecimal payAmount;
    private Integer payStatus;
    private String thirdPayNo;
    private String thirdResp;
    private LocalDateTime gmtCreate;
    private LocalDateTime gmtModified;
}
