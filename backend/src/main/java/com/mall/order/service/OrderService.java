package com.mall.order.service;

import com.mall.order.dto.CreateOrderRequest;
import com.mall.order.entity.MallOrderDO;
import com.mall.order.entity.OrderStatusLogDO;

import java.util.List;

/**
 * 订单服务接口
 */
public interface OrderService {

    /**
     * 创建订单
     */
    MallOrderDO createOrder(Long userId, CreateOrderRequest request);

    /**
     * 根据ID查询订单
     */
    MallOrderDO getOrderById(Long orderId);

    /**
     * 根据用户ID查询订单列表
     */
    List<MallOrderDO> listOrdersByUserId(Long userId, int pageNum, int pageSize);

    /**
     * 取消订单
     */
    void cancelOrder(Long userId, Long orderId);

    /**
     * 更新订单状态
     */
    void updateOrderStatus(Long orderId, Integer newStatus, String operator, String remark);

    /**
     * 记录订单状态变更日志
     */
    void logOrderStatusChange(OrderStatusLogDO log);
}
