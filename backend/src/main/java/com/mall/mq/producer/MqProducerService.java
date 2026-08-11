package com.mall.mq.producer;

import org.apache.rocketmq.spring.core.RocketMQTemplate;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

/**
 * MQ生产者服务
 */
@Service
public class MqProducerService {

    @Autowired
    private RocketMQTemplate rocketMQTemplate;

    /**
     * 发送普通消息
     */
    public void sendMessage(String topic, Object message) {
        rocketMQTemplate.convertAndSend(topic, message);
    }

    /**
     * 发送延时消息
     */
    public void sendDelayMessage(String topic, Object message, int delayLevel) {
        org.apache.rocketmq.spring.support.RocketMQUtil.createRocketMQMessage(topic, message);
        // 实际使用时需要设置延时级别
        rocketMQTemplate.syncSendDelayTimeSeconds(topic, message, delayLevel);
    }

    /**
     * 发送带tag的消息
     */
    public void sendMessageWithTag(String topic, String tag, Object message) {
        rocketMQTemplate.convertAndSend(topic + ":" + tag, message);
    }
}
