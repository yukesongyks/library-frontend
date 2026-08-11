package com.mall.mq.consumer;

import org.apache.rocketmq.spring.annotation.RocketMQMessageListener;
import org.apache.rocketmq.spring.core.RocketMQListener;
import org.springframework.stereotype.Service;

/**
 * 秒杀订单异步创建消费者
 */
@Service
@RocketMQMessageListener(topic = "seckill-order-create", consumerGroup = "seckill-order-consumer-group")
public class SeckillOrderConsumer implements RocketMQListener<String> {

    @Override
    public void onMessage(String message) {
        // 异步创建秒杀订单
        // 1. 解析秒杀请求
        // 2. 创建订单
        // 3. 更新秒杀活动已售数量
    }
}
