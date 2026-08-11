package com.mall.order.mapper;

import com.mall.order.entity.OrderItemDO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 订单商品项Mapper
 */
@Mapper
public interface OrderItemMapper {

    /**
     * 根据订单ID查询订单商品项
     */
    List<OrderItemDO> selectByOrderId(@Param("orderId") Long orderId);

    /**
     * 批量插入订单商品项
     */
    int batchInsert(List<OrderItemDO> items);
}
