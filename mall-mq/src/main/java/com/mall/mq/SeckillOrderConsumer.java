package com.mall.mq;

import com.mall.common.util.JsonUtil;
import com.mall.common.enums.OrderStatus;
import com.mall.common.enums.PayStatus;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.annotation.RocketMQMessageListener;
import org.apache.rocketmq.spring.core.RocketMQListener;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;
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
            SeckillOrderMessage orderMessage = JsonUtil.fromJson(message, SeckillOrderMessage.class);
            if (orderMessage == null || orderMessage.getOrderNo() == null) {
                log.error("Invalid seckill order message, cannot parse or missing orderNo: {}", message);
                return;
            }

            String idempotentKey = SECKILL_ORDER_IDEMPOTENT_KEY + orderMessage.getOrderNo();
            Boolean success = redisTemplate.opsForValue()
                    .setIfAbsent(idempotentKey, "1", 24, TimeUnit.HOURS);
            if (Boolean.FALSE.equals(success)) {
                log.warn("Duplicate seckill order message, skip processing. orderNo={}", orderMessage.getOrderNo());
                return;
            }

            processSeckillOrder(orderMessage);
            log.info("Successfully processed seckill order, orderNo={}", orderMessage.getOrderNo());
        } catch (Exception e) {
            log.error("Process seckill order message failed: {}", message, e);
        }
    }

    private void processSeckillOrder(SeckillOrderMessage message) {
        log.info("Processing seckill order, orderNo={}, userId={}, activityId={}",
                message.getOrderNo(), message.getUserId(), message.getActivityId());
    }

    public static class SeckillOrderMessage {
        private String orderNo;
        private Long userId;
        private Long activityId;
        private Long skuId;

        public String getOrderNo() { return orderNo; }
        public void setOrderNo(String orderNo) { this.orderNo = orderNo; }
        public Long getUserId() { return userId; }
        public void setUserId(Long userId) { this.userId = userId; }
        public Long getActivityId() { return activityId; }
        public void setActivityId(Long activityId) { this.activityId = activityId; }
        public Long getSkuId() { return skuId; }
        public void setSkuId(Long skuId) { this.skuId = skuId; }
    }
}
