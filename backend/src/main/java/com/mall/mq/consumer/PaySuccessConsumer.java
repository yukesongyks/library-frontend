package com.mall.mq.consumer;

import org.apache.rocketmq.spring.annotation.RocketMQMessageListener;
import org.apache.rocketmq.spring.core.RocketMQListener;
import org.springframework.stereotype.Service;

/**
 * 支付成功消息消费者
 */
@Service
@RocketMQMessageListener(topic = "order-pay-success", consumerGroup = "pay-success-consumer-group")
public class PaySuccessConsumer implements RocketMQListener<String> {

    @Override
    public void onMessage(String message) {
        // 处理支付成功后的异步通知
        // 1. 解析订单ID
        // 2. 更新订单状态为已支付
        // 3. 发送通知消息
    }
}
