package com.mall.pay.service;

import com.mall.pay.dto.CreatePayRequest;
import com.mall.pay.dto.RefundRequest;
import com.mall.pay.entity.PayRecordDO;
import com.mall.pay.entity.RefundRecordDO;

import java.util.List;

/**
 * 支付服务接口
 */
public interface PayService {

    /**
     * 创建支付
     */
    PayRecordDO createPay(CreatePayRequest request);

    /**
     * 处理支付回调
     */
    void handlePayCallback(String channel, java.util.Map<String, String> params);

    /**
     * 申请退款
     */
    RefundRecordDO applyRefund(RefundRequest request);

    /**
     * 根据ID查询支付记录
     */
    PayRecordDO getPayRecordById(Long id);

    /**
     * 根据订单ID查询支付记录
     */
    List<PayRecordDO> listPayRecordsByOrderId(Long orderId);
}
