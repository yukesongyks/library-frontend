package com.mall.seckill.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 秒杀订单表
 */
@Data
public class SeckillOrderDO {
    /**
     * 系统自增主键
     */
    private Long id;

    /**
     * 活动ID
     */
    private Long activityId;

    /**
     * 订单ID
     */
    private Long orderId;

    /**
     * 用户ID
     */
    private Long userId;

    /**
     * 创建时间
     */
    private LocalDateTime gmtCreate;
}
