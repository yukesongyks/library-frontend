package com.mall.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.mall.api.entity.*;
import com.mall.api.request.OrderCreateRequest;
import com.mall.common.enums.OrderStatus;
import com.mall.common.enums.PayStatus;
import com.mall.common.enums.ProductStatus;
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
import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class OrderService {

    private final MallOrderMapper mallOrderMapper;
    private final OrderItemMapper orderItemMapper;
    private final OrderStatusLogMapper orderStatusLogMapper;
    private final CartItemMapper cartItemMapper;
    private final SkuInfoMapper skuInfoMapper;
    private final ProductMapper productMapper;
    private final RedisTemplate<String, Object> redisTemplate;

    @Transactional(rollbackFor = Exception.class)
    public MallOrder createOrder(Long userId, OrderCreateRequest request) {
        List<Long> cartItemIds = request.getCartItemIds();
        if (cartItemIds == null || cartItemIds.isEmpty()) {
            throw new MallException(ResultCode.ORDER_CART_EMPTY);
        }

        List<CartItem> cartItems = cartItemMapper.selectBatchIds(cartItemIds);
        if (cartItems.isEmpty()) {
            throw new MallException(ResultCode.ORDER_CART_EMPTY);
        }

        BigDecimal totalAmount = BigDecimal.ZERO;
        for (CartItem cartItem : cartItems) {
            SkuInfo skuInfo = skuInfoMapper.selectById(cartItem.getSkuId());
            if (skuInfo == null) {
                throw new MallException(ResultCode.ORDER_STATUS_INVALID);
            }
            Product product = productMapper.selectById(skuInfo.getProductId());
            if (product == null || product.getProductStatus() != ProductStatus.ON_SHELF.getCode()) {
                throw new MallException(ResultCode.ORDER_PRODUCT_OFF_SHELF);
            }
            if (skuInfo.getSkuStock() < cartItem.getQuantity()) {
                throw new MallException(ResultCode.ORDER_STOCK_INSUFFICIENT);
            }
            totalAmount = totalAmount.add(skuInfo.getSkuPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())));
        }

        MallOrder order = new MallOrder();
        order.setOrderNo(OrderNoUtil.generateOrderNo());
        order.setUserId(userId);
        order.setTotalAmount(totalAmount);
        order.setPayAmount(totalAmount);
        order.setOrderStatus(OrderStatus.PENDING_PAYMENT.getCode());
        order.setPayStatus(PayStatus.UNPAID.getCode());
        order.setRemark(request.getRemark());
        mallOrderMapper.insert(order);

        for (CartItem cartItem : cartItems) {
            SkuInfo skuInfo = skuInfoMapper.selectById(cartItem.getSkuId());
            OrderItem orderItem = new OrderItem();
            orderItem.setOrderId(order.getId());
            orderItem.setSkuId(cartItem.getSkuId());
            orderItem.setSkuName(skuInfo.getSkuName());
            orderItem.setSkuPrice(skuInfo.getSkuPrice());
            orderItem.setQuantity(cartItem.getQuantity());
            orderItem.setSubtotal(skuInfo.getSkuPrice().multiply(BigDecimal.valueOf(cartItem.getQuantity())));
            orderItemMapper.insert(orderItem);

            skuInfoMapper.deductStock(cartItem.getSkuId(), cartItem.getQuantity());
        }

        saveOrderStatusLog(order.getId(), null, OrderStatus.PENDING_PAYMENT, "SYSTEM", "订单创建");

        for (CartItem cartItem : cartItems) {
            cartItemMapper.deleteById(cartItem.getId());
        }

        return order;
    }

    public MallOrder getOrderDetail(Long orderId) {
        return mallOrderMapper.selectById(orderId);
    }

    public List<MallOrder> getOrderList(Long userId) {
        LambdaQueryWrapper<MallOrder> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(MallOrder::getUserId, userId).orderByDesc(MallOrder::getGmtCreate);
        return mallOrderMapper.selectList(wrapper);
    }

    @Transactional(rollbackFor = Exception.class)
    public void cancelOrder(Long userId, Long orderId) {
        MallOrder order = mallOrderMapper.selectById(orderId);
        if (order == null || !order.getUserId().equals(userId)) {
            throw new MallException(ResultCode.ORDER_NOT_FOUND);
        }
        if (order.getOrderStatus() != OrderStatus.PENDING_PAYMENT.getCode()) {
            throw new MallException(ResultCode.ORDER_STATUS_INVALID);
        }

        order.setOrderStatus(OrderStatus.CANCELLED.getCode());
        mallOrderMapper.updateById(order);

        LambdaQueryWrapper<OrderItem> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(OrderItem::getOrderId, orderId);
        List<OrderItem> orderItems = orderItemMapper.selectList(wrapper);
        for (OrderItem item : orderItems) {
            skuInfoMapper.releaseStock(item.getSkuId(), item.getQuantity());
        }

        saveOrderStatusLog(orderId, OrderStatus.PENDING_PAYMENT, OrderStatus.CANCELLED, "USER", "用户取消订单");
    }

    @Transactional(rollbackFor = Exception.class)
    public void updateOrderStatus(Long orderId, OrderStatus newStatus, String operator, String remark) {
        MallOrder order = mallOrderMapper.selectById(orderId);
        if (order == null) {
            throw new MallException(ResultCode.ORDER_NOT_FOUND);
        }
        OrderStatus oldStatus = OrderStatus.of(order.getOrderStatus());
        order.setOrderStatus(newStatus.getCode());
        mallOrderMapper.updateById(order);
        saveOrderStatusLog(orderId, oldStatus, newStatus, operator, remark);
    }

    private void saveOrderStatusLog(Long orderId, OrderStatus fromStatus, OrderStatus toStatus, String operator, String remark) {
        OrderStatusLog log = new OrderStatusLog();
        log.setOrderId(orderId);
        log.setFromStatus(fromStatus != null ? fromStatus.getCode() : null);
        log.setToStatus(toStatus.getCode());
        log.setOperator(operator);
        log.setRemark(remark);
        orderStatusLogMapper.insert(log);
    }
}
