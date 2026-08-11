package com.mall.seckill.vo;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 秒杀订单视图对象
 */
@Data
public class SeckillOrderVO {
    private Long id;
    private Long activityId;
    private Long orderId;
    private Long userId;
    private LocalDateTime gmtCreate;
}
