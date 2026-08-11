package com.mall.common.enums;

import lombok.Getter;

@Getter
public enum RefundStatus {
    PENDING(0, "待处理"),
    PROCESSING(1, "退款中"),
    SUCCESS(2, "退款成功"),
    FAILED(3, "退款失败");

    private final int code;
    private final String desc;

    RefundStatus(int code, String desc) {
        this.code = code;
        this.desc = desc;
    }
}
