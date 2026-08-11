package com.mall.pay.impl;

import com.mall.pay.PayChannelService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;

@Slf4j
@Service("alipayChannelService")
public class AlipayChannelService implements PayChannelService {

    @Value("${pay.alipay.appId:}")
    private String appId;

    @Value("${pay.alipay.merchantId:}")
    private String merchantId;

    @Value("${pay.alipay.privateKey:}")
    private String privateKey;

    @Value("${pay.alipay.publicKey:}")
    private String publicKey;

    @Override
    public String createPayOrder(String orderNo, BigDecimal amount, String subject) {
        log.info("Alipay create pay order, orderNo={}, amount={}, subject={}", orderNo, amount, subject);
        // Simulate Alipay pre-create order
        return "alipay_trade_no_" + orderNo;
    }

    @Override
    public boolean verifyCallback(Map<String, String> params) {
        log.info("Alipay verify callback, params={}", params);
        // Simulate signature verification
        String sign = params.get("sign");
        return sign != null && !sign.isEmpty();
    }

    @Override
    public String queryOrder(String outTradeNo) {
        log.info("Alipay query order, outTradeNo={}", outTradeNo);
        return "SUCCESS";
    }

    @Override
    public String refund(String outTradeNo, String refundNo, BigDecimal amount, String reason) {
        log.info("Alipay refund, outTradeNo={}, refundNo={}, amount={}, reason={}", outTradeNo, refundNo, amount, reason);
        return "alipay_refund_no_" + refundNo;
    }
}
