package com.mall.seckill.mapper;

import com.mall.seckill.entity.SeckillActivityDO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 秒杀活动Mapper
 */
@Mapper
public interface SeckillActivityMapper {

    /**
     * 根据ID查询秒杀活动
     */
    SeckillActivityDO selectById(@Param("id") Long id);

    /**
     * 查询所有秒杀活动列表
     */
    List<SeckillActivityDO> selectAll();

    /**
     * 根据状态查询秒杀活动
     */
    List<SeckillActivityDO> selectByStatus(@Param("status") Integer status);

    /**
     * 扣减秒杀库存
     */
    int deductStock(@Param("id") Long id, @Param("quantity") Integer quantity);

    /**
     * 增加已售数量
     */
    int incrementSold(@Param("id") Long id, @Param("quantity") Integer quantity);
}
