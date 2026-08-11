package com.mall.mq;

import com.mall.common.util.JsonUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.annotation.RocketMQMessageListener;
import org.apache.rocketmq.spring.core.RocketMQListener;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.util.concurrent.TimeUnit;

@Slf4j
@Component
@RequiredArgsConstructor
@RocketMQMessageListener(topic = "seckill-order-create", consumerGroup = "seckill-order-consumer-group")
public class SeckillOrderConsumer implements RocketMQListener<String> {

    private static final String SECKILL_ORDER_IDEMPOTENT_KEY = "seckill:order:idempotent:";

    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public void onMessage(String message) {
        log.info("Receive seckill order message: {}", message);
        try {
            String idempotentKey = SECKILL_ORDER_IDEMPOTENT_KEY + message.hashCode();
            Boolean success = redisTemplate.opsForValue()
                    .setIfAbsent(idempotentKey, "1", 24, TimeUnit.HOURS);
            if (Boolean.FALSE.equals(success)) {
                log.warn("Duplicate seckill order message, skip processing. message={}", message);
                return;
            }
            log.info("Processing seckill order message: {}", message);
        } catch (Exception e) {
            log.error("Process seckill order message failed: {}", message, e);
        }
    }
}
