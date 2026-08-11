package com.mall.service;

import com.mall.api.entity.SeckillActivity;
import com.mall.api.entity.SeckillOrder;
import com.mall.common.enums.OrderStatus;
import com.mall.common.enums.PayStatus;
import com.mall.common.enums.SeckillActivityStatus;
import com.mall.common.exception.MallException;
import com.mall.common.result.ResultCode;
import com.mall.common.util.OrderNoUtil;
import com.mall.dao.mapper.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class SeckillService {

    private final SeckillActivityMapper seckillActivityMapper;
    private final SeckillOrderMapper seckillOrderMapper;
    private final MallOrderMapper mallOrderMapper;
    private final OrderItemMapper orderItemMapper;
    private final SkuInfoMapper skuInfoMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String SECKILL_STOCK_KEY = "seckill:stock:";
    private static final String SECKILL_USER_KEY = "seckill:user:";

    public List<SeckillActivity> listActivities() {
        return seckillActivityMapper.selectList(null);
    }

    @Transactional(rollbackFor = Exception.class)
    public String createSeckillOrder(Long activityId, Long userId, Long skuId) {
        SeckillActivity activity = seckillActivityMapper.selectById(activityId);
        if (activity == null) {
            throw new MallException(ResultCode.SECKILL_ACTIVITY_NOT_FOUND);
        }
        LocalDateTime now = LocalDateTime.now();
        if (now.isBefore(activity.getStartTime()) || now.isAfter(activity.getEndTime())) {
            throw new MallException(ResultCode.SECKILL_ACTIVITY_NOT_STARTED);
        }
        if (activity.getActivityStatus() != SeckillActivityStatus.IN_PROGRESS.getCode()) {
            throw new MallException(ResultCode.SECKILL_ACTIVITY_NOT_STARTED);
        }

        String stockKey = SECKILL_STOCK_KEY + activityId;
        Long remaining = redisTemplate.opsForValue().decrement(stockKey);
        if (remaining == null || remaining < 0) {
            redisTemplate.opsForValue().increment(stockKey);
            throw new MallException(ResultCode.SECKILL_STOCK_INSUFFICIENT);
        }

        String userKey = SECKILL_USER_KEY + activityId + ":" + userId;
        Boolean success = redisTemplate.opsForValue().setIfAbsent(userKey, "1", 1, TimeUnit.HOURS);
        if (Boolean.FALSE.equals(success)) {
            redisTemplate.opsForValue().increment(stockKey);
            throw new MallException(ResultCode.SECKILL_ALREADY_PARTICIPATED);
        }

        com.mall.api.entity.MallOrder order = new com.mall.api.entity.MallOrder();
        order.setOrderNo(OrderNoUtil.generateOrderNo());
        order.setUserId(userId);
        order.setTotalAmount(activity.getSeckillPrice());
        order.setPayAmount(activity.getSeckillPrice());
        order.setOrderStatus(OrderStatus.PENDING_PAYMENT.getCode());
        order.setPayStatus(PayStatus.UNPAID.getCode());
        mallOrderMapper.insert(order);

        com.mall.api.entity.OrderItem orderItem = new com.mall.api.entity.OrderItem();
        orderItem.setOrderId(order.getId());
        orderItem.setSkuId(skuId);
        orderItem.setSkuName("秒杀商品");
        orderItem.setSkuPrice(activity.getSeckillPrice());
        orderItem.setQuantity(1);
        orderItem.setSubtotal(activity.getSeckillPrice());
        orderItemMapper.insert(orderItem);

        SeckillOrder seckillOrder = new SeckillOrder();
        seckillOrder.setActivityId(activityId);
        seckillOrder.setOrderId(order.getId());
        seckillOrder.setUserId(userId);
        seckillOrderMapper.insert(seckillOrder);

        seckillActivityMapper.increaseSoldQuantity(activityId, 1);

        return order.getOrderNo();
    }
}
