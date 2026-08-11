package com.mall.common.enums;

import lombok.Getter;

/**
 * 支付渠道枚举
 */
@Getter
public enum PayChannel {
    /**
     * 支付宝
     */
    ALIPAY("alipay", "支付宝"),
    /**
     * 微信支付
     */
    WECHAT("wechat", "微信支付");

    private final String code;
    private final String desc;

    PayChannel(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }
}
