package com.mall.pay;

import java.math.BigDecimal;
import java.util.Map;

public interface PayChannelService {

    String createPayOrder(String orderNo, BigDecimal amount, String subject);

    boolean verifyCallback(Map<String, String> params);

    String queryOrder(String outTradeNo);

    String refund(String outTradeNo, String refundNo, BigDecimal amount, String reason);
}
