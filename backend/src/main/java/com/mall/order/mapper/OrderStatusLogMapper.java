package com.mall.order.mapper;

import com.mall.order.entity.OrderStatusLogDO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 订单状态日志Mapper
 */
@Mapper
public interface OrderStatusLogMapper {

    /**
     * 插入订单状态变更日志
     */
    int insert(OrderStatusLogDO log);

    /**
     * 根据订单ID查询状态变更日志
     */
    List<OrderStatusLogDO> selectByOrderId(@Param("orderId") Long orderId);
}
