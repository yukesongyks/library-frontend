package com.mall.common.enums;

import lombok.Getter;

/**
 * 订单状态枚举
 */
@Getter
public enum OrderStatus {
    /**
     * 待支付
     */
    PENDING_PAYMENT(0, "待支付"),
    /**
     * 已支付
     */
    PAID(1, "已支付"),
    /**
     * 处理中
     */
    PROCESSING(2, "处理中"),
    /**
     * 已发货
     */
    SHIPPED(3, "已发货"),
    /**
     * 已完成
     */
    COMPLETED(4, "已完成"),
    /**
     * 已取消
     */
    CANCELLED(5, "已取消"),
    /**
     * 退款中
     */
    REFUNDING(6, "退款中"),
    /**
     * 已退款
     */
    REFUNDED(7, "已退款");

    private final int code;
    private final String desc;

    OrderStatus(int code, String desc) {
        this.code = code;
        this.desc = desc;
    }
}
