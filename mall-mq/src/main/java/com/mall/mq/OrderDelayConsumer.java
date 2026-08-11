package com.mall.mq;

import com.mall.api.entity.MallOrder;
import com.mall.common.enums.OrderStatus;
import com.mall.common.enums.PayStatus;
import com.mall.dao.mapper.MallOrderMapper;
import com.mall.dao.mapper.SkuInfoMapper;
import com.mall.dao.mapper.OrderItemMapper;
import com.mall.api.entity.OrderItem;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.annotation.RocketMQMessageListener;
import org.apache.rocketmq.spring.core.RocketMQListener;
import org.springframework.stereotype.Component;

import java.util.List;

@Slf4j
@Component
@RequiredArgsConstructor
@RocketMQMessageListener(topic = "order-delay", consumerGroup = "order-delay-consumer-group")
public class OrderDelayConsumer implements RocketMQListener<String> {

    private final MallOrderMapper mallOrderMapper;
    private final OrderItemMapper orderItemMapper;
    private final SkuInfoMapper skuInfoMapper;

    @Override
    public void onMessage(String message) {
        log.info("Receive order delay message: {}", message);
        try {
            Long orderId = Long.valueOf(message);
            MallOrder order = mallOrderMapper.selectById(orderId);
            if (order != null && order.getOrderStatus() == OrderStatus.PENDING_PAYMENT.getCode()) {
                order.setOrderStatus(OrderStatus.CANCELLED.getCode());
                order.setPayStatus(PayStatus.UNPAID.getCode());
                mallOrderMapper.updateById(order);

                List<OrderItem> orderItems = orderItemMapper.selectList(
                        new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<OrderItem>()
                                .eq(OrderItem::getOrderId, orderId));
                for (OrderItem item : orderItems) {
                    skuInfoMapper.releaseStock(item.getSkuId(), item.getQuantity());
                }
                log.info("Order {} cancelled due to timeout", orderId);
            }
        } catch (Exception e) {
            log.error("Process order delay message failed: {}", message, e);
        }
    }
}
