package com.mall.mq;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.annotation.RocketMQMessageListener;
import org.apache.rocketmq.spring.core.RocketMQListener;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@RocketMQMessageListener(topic = "stock-sync", consumerGroup = "stock-sync-consumer-group")
public class StockSyncConsumer implements RocketMQListener<String> {

    @Override
    public void onMessage(String message) {
        log.info("Receive stock sync message: {}", message);
        // Stock sync processing logic
    }
}
