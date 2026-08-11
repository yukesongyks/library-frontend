package com.mall.seckill.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

/**
 * 秒杀下单请求
 */
@Data
public class SeckillOrderRequest {
    @NotNull(message = "活动ID不能为空")
    private Long activityId;

    @NotNull(message = "SKU ID不能为空")
    private Long skuId;
}
