package com.mall.mq.consumer;

import org.apache.rocketmq.spring.annotation.RocketMQMessageListener;
import org.apache.rocketmq.spring.core.RocketMQListener;
import org.springframework.stereotype.Service;

/**
 * 订单延时消息消费者
 */
@Service
@RocketMQMessageListener(topic = "order-delay", consumerGroup = "order-delay-consumer-group")
public class OrderDelayConsumer implements RocketMQListener<String> {

    @Override
    public void onMessage(String message) {
        // 处理订单超时未支付逻辑
        // 1. 解析订单ID
        // 2. 查询订单状态
        // 3. 如果订单仍待支付，则取消订单并释放库存
    }
}
