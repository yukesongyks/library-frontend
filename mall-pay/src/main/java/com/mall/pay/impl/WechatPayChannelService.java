package com.mall.pay.impl;

import com.mall.pay.PayChannelService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;

@Slf4j
@Service("wechatPayChannelService")
public class WechatPayChannelService implements PayChannelService {

    @Value("${pay.wechat.appId:}")
    private String appId;

    @Value("${pay.wechat.merchantId:}")
    private String merchantId;

    @Value("${pay.wechat.apiKey:}")
    private String apiKey;

    @Override
    public String createPayOrder(String orderNo, BigDecimal amount, String subject) {
        log.info("WechatPay create pay order, orderNo={}, amount={}, subject={}", orderNo, amount, subject);
        // Simulate Wechat unified order
        return "wechat_prepay_id_" + orderNo;
    }

    @Override
    public boolean verifyCallback(Map<String, String> params) {
        log.info("WechatPay verify callback, params={}", params);
        String sign = params.get("sign");
        return sign != null && !sign.isEmpty();
    }

    @Override
    public String queryOrder(String outTradeNo) {
        log.info("WechatPay query order, outTradeNo={}", outTradeNo);
        return "SUCCESS";
    }

    @Override
    public String refund(String outTradeNo, String refundNo, BigDecimal amount, String reason) {
        log.info("WechatPay refund, outTradeNo={}, refundNo={}, amount={}, reason={}", outTradeNo, refundNo, amount, reason);
        return "wechat_refund_no_" + refundNo;
    }
}
