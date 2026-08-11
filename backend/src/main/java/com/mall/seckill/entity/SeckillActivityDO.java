package com.mall.seckill.entity;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

/**
 * 秒杀活动表
 */
@Data
public class SeckillActivityDO {
    /**
     * 系统自增主键
     */
    private Long id;

    /**
     * 活动名称
     */
    private String activityName;

    /**
     * SKU ID
     */
    private Long skuId;

    /**
     * 秒杀价
     */
    private BigDecimal seckillPrice;

    /**
     * 秒杀库存
     */
    private Integer stockQuantity;

    /**
     * 已售数量
     */
    private Integer soldQuantity;

    /**
     * 开始时间
     */
    private LocalDateTime startTime;

    /**
     * 结束时间
     */
    private LocalDateTime endTime;

    /**
     * 活动状态
     */
    private Integer activityStatus;

    /**
     * 创建时间
     */
    private LocalDateTime gmtCreate;

    /**
     * 修改时间
     */
    private LocalDateTime gmtModified;
}
