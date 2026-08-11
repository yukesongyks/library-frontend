package com.mall.api.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("seckill_activity")
public class SeckillActivity {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String activityName;
    private Long skuId;
    private BigDecimal seckillPrice;
    private Integer stockQuantity;
    private Integer soldQuantity;
    private LocalDateTime startTime;
    private LocalDateTime endTime;
    private Integer activityStatus;
    private LocalDateTime gmtCreate;
    private LocalDateTime gmtModified;
}
