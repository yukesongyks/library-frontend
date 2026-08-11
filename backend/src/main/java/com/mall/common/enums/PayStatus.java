package com.mall.common.enums;

import lombok.Getter;

/**
 * 支付状态枚举
 */
@Getter
public enum PayStatus {
    /**
     * 未支付
     */
    UNPAID(0, "未支付"),
    /**
     * 已支付
     */
    PAID(1, "已支付"),
    /**
     * 部分退款
     */
    PARTIAL_REFUND(2, "部分退款"),
    /**
     * 全额退款
     */
    FULL_REFUND(3, "全额退款");

    private final int code;
    private final String desc;

    PayStatus(int code, String desc) {
        this.code = code;
        this.desc = desc;
    }
}
