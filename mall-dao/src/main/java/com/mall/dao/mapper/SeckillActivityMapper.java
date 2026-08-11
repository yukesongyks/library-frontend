package com.mall.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.mall.api.entity.SeckillActivity;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface SeckillActivityMapper extends BaseMapper<SeckillActivity> {

    @Update("UPDATE seckill_activity SET sold_quantity = sold_quantity + #{quantity} WHERE id = #{id} AND sold_quantity + #{quantity} <= stock_quantity")
    int increaseSoldQuantity(@Param("id") Long id, @Param("quantity") Integer quantity);
}
