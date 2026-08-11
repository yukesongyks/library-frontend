package com.mall.seckill.mapper;

import com.mall.seckill.entity.SeckillOrderDO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 秒杀订单Mapper
 */
@Mapper
public interface SeckillOrderMapper {

    /**
     * 根据ID查询秒杀订单
     */
    SeckillOrderDO selectById(@Param("id") Long id);

    /**
     * 根据用户ID和活动ID查询秒杀订单
     */
    SeckillOrderDO selectByUserIdAndActivityId(@Param("userId") Long userId,
                                                 @Param("activityId") Long activityId);

    /**
     * 插入秒杀订单
     */
    int insert(SeckillOrderDO seckillOrder);

    /**
     * 根据用户ID查询秒杀订单列表
     */
    List<SeckillOrderDO> selectByUserId(@Param("userId") Long userId);
}
