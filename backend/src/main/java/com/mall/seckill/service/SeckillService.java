package com.mall.seckill.service;

import com.mall.seckill.dto.SeckillOrderRequest;
import com.mall.seckill.entity.SeckillActivityDO;
import com.mall.seckill.entity.SeckillOrderDO;

import java.util.List;

/**
 * 秒杀服务接口
 */
public interface SeckillService {

    /**
     * 创建秒杀订单
     */
    SeckillOrderDO createSeckillOrder(Long userId, SeckillOrderRequest request);

    /**
     * 根据ID查询秒杀活动
     */
    SeckillActivityDO getActivityById(Long activityId);

    /**
     * 查询所有秒杀活动
     */
    List<SeckillActivityDO> listActivities();

    /**
     * 检查用户是否已参与秒杀活动
     */
    boolean hasParticipated(Long userId, Long activityId);
}
