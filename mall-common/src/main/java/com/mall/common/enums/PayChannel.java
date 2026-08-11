package com.mall.common.enums;

import lombok.Getter;

@Getter
public enum PayChannel {
    ALIPAY("alipay", "支付宝"),
    WECHAT("wechat", "微信支付");

    private final String code;
    private final String desc;

    PayChannel(String code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public static PayChannel of(String code) {
        for (PayChannel channel : values()) {
            if (channel.code.equalsIgnoreCase(code)) {
                return channel;
            }
        }
        throw new IllegalArgumentException("Unknown pay channel: " + code);
    }
}
