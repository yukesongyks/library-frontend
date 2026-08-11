package com.mall.common.enums;

import lombok.Getter;

@Getter
public enum PayStatus {
    UNPAID(0, "未支付"),
    PAID(1, "已支付"),
    PARTIAL_REFUND(2, "部分退款"),
    FULL_REFUND(3, "全额退款");

    private final int code;
    private final String desc;

    PayStatus(int code, String desc) {
        this.code = code;
        this.desc = desc;
    }

    public static PayStatus of(int code) {
        for (PayStatus status : values()) {
            if (status.code == code) {
                return status;
            }
        }
        throw new IllegalArgumentException("Unknown pay status code: " + code);
    }
}
