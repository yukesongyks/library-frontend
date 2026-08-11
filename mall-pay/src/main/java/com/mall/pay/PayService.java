package com.mall.pay;

import com.mall.api.entity.MallOrder;
import com.mall.api.entity.PayRecord;
import com.mall.api.entity.RefundRecord;
import com.mall.common.enums.OrderStatus;
import com.mall.common.enums.PayStatus;
import com.mall.common.enums.PaymentStatus;
import com.mall.common.enums.RefundStatus;
import com.mall.common.exception.MallException;
import com.mall.common.result.ResultCode;
import com.mall.common.util.OrderNoUtil;
import com.mall.dao.mapper.MallOrderMapper;
import com.mall.dao.mapper.PayRecordMapper;
import com.mall.dao.mapper.RefundRecordMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class PayService {

    private final PayRecordMapper payRecordMapper;
    private final RefundRecordMapper refundRecordMapper;
    private final MallOrderMapper mallOrderMapper;
    private final PayChannelService alipayChannelService;
    private final PayChannelService wechatPayChannelService;

    @Transactional(rollbackFor = Exception.class)
    public PayRecord createPay(Long orderId, String channel) {
        MallOrder order = mallOrderMapper.selectById(orderId);
        if (order == null) {
            throw new MallException(ResultCode.PAY_ORDER_NOT_FOUND);
        }
        if (order.getOrderStatus() != OrderStatus.PENDING_PAYMENT.getCode()) {
            throw new MallException(ResultCode.PAY_STATUS_INVALID);
        }

        PayRecord payRecord = new PayRecord();
        payRecord.setOrderId(orderId);
        payRecord.setPayNo(OrderNoUtil.generatePayNo());
        payRecord.setChannel(channel);
        payRecord.setPayAmount(order.getPayAmount());
        payRecord.setPayStatus(PaymentStatus.PENDING.getCode());
        payRecordMapper.insert(payRecord);

        PayChannelService channelService = getChannelService(channel);
        String thirdPayNo = channelService.createPayOrder(payRecord.getPayNo(), payRecord.getPayAmount(), "订单支付");
        payRecord.setThirdPayNo(thirdPayNo);
        payRecordMapper.updateById(payRecord);

        return payRecord;
    }

    @Transactional(rollbackFor = Exception.class)
    public void handlePayCallback(String channel, Map<String, String> params) {
        PayChannelService channelService = getChannelService(channel);
        if (!channelService.verifyCallback(params)) {
            throw new MallException(ResultCode.PAY_SIGN_INVALID);
        }

        String payNo = params.get("out_trade_no");
        PayRecord payRecord = payRecordMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<PayRecord>()
                        .eq(PayRecord::getPayNo, payNo));
        if (payRecord == null) {
            throw new MallException(ResultCode.PAY_ORDER_NOT_FOUND);
        }

        if (payRecord.getPayStatus() == PaymentStatus.SUCCESS.getCode()) {
            throw new MallException(ResultCode.PAY_ALREADY_PROCESSED);
        }

        payRecord.setPayStatus(PaymentStatus.SUCCESS.getCode());
        payRecordMapper.updateById(payRecord);

        MallOrder order = mallOrderMapper.selectById(payRecord.getOrderId());
        order.setOrderStatus(OrderStatus.PAID.getCode());
        order.setPayStatus(PayStatus.PAID.getCode());
        order.setPayChannel(channel);
        mallOrderMapper.updateById(order);
    }

    @Transactional(rollbackFor = Exception.class)
    public RefundRecord applyRefund(Long orderId, BigDecimal amount, String reason) {
        MallOrder order = mallOrderMapper.selectById(orderId);
        if (order == null) {
            throw new MallException(ResultCode.ORDER_NOT_FOUND);
        }
        if (order.getPayStatus() != PayStatus.PAID.getCode()) {
            throw new MallException(ResultCode.REFUND_STATUS_INVALID);
        }
        if (amount.compareTo(order.getPayAmount()) > 0) {
            throw new MallException(ResultCode.REFUND_AMOUNT_EXCEED);
        }

        PayRecord payRecord = payRecordMapper.selectOne(
                new com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper<PayRecord>()
                        .eq(PayRecord::getOrderId, orderId)
                        .eq(PayRecord::getPayStatus, PaymentStatus.SUCCESS.getCode()));
        if (payRecord == null) {
            throw new MallException(ResultCode.PAY_ORDER_NOT_FOUND);
        }

        RefundRecord refundRecord = new RefundRecord();
        refundRecord.setOrderId(orderId);
        refundRecord.setPayRecordId(payRecord.getId());
        refundRecord.setRefundNo(OrderNoUtil.generateRefundNo());
        refundRecord.setRefundAmount(amount);
        refundRecord.setRefundStatus(RefundStatus.PENDING.getCode());
        refundRecord.setReason(reason);
        refundRecordMapper.insert(refundRecord);

        PayChannelService channelService = getChannelService(payRecord.getChannel());
        String thirdRefundNo = channelService.refund(payRecord.getThirdPayNo(), refundRecord.getRefundNo(), amount, reason);
        refundRecord.setThirdRefundNo(thirdRefundNo);
        refundRecord.setRefundStatus(RefundStatus.SUCCESS.getCode());
        refundRecordMapper.updateById(refundRecord);

        order.setPayStatus(PayStatus.FULL_REFUND.getCode());
        order.setOrderStatus(OrderStatus.REFUNDED.getCode());
        mallOrderMapper.updateById(order);

        return refundRecord;
    }

    private PayChannelService getChannelService(String channel) {
        if ("alipay".equalsIgnoreCase(channel)) {
            return alipayChannelService;
        } else if ("wechat".equalsIgnoreCase(channel)) {
            return wechatPayChannelService;
        }
        throw new MallException(ResultCode.PAY_CHANNEL_UNSUPPORTED);
    }
}
