package com.mall.common.enums;

import lombok.Getter;

@Getter
public enum PaymentStatus {
    PENDING(0, "待支付"),
    PAYING(1, "支付中"),
    SUCCESS(2, "支付成功"),
    FAILED(3, "支付失败");

    private final int code;
    private final String desc;

    PaymentStatus(int code, String desc) {
        this.code = code;
        this.desc = desc;
    }
}
