package com.mall.seckill.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 秒杀活动视图对象
 */
@Data
public class SeckillActivityVO {
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
