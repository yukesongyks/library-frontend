package com.mall.common.result;

import lombok.Getter;

@Getter
public enum ResultCode {
    SUCCESS("000000", "success"),
    SYSTEM_ERROR("999999", "system error"),
    PARAM_ERROR("999998", "param error"),

    PRODUCT_NOT_FOUND("PRODUCT_001", "product not found"),
    PRODUCT_SOLD_OUT("PRODUCT_002", "product sold out"),
    PRODUCT_OFF_SHELF("PRODUCT_003", "product off shelf"),

    CART_ITEM_NOT_FOUND("CART_001", "cart item not found"),
    CART_STOCK_INSUFFICIENT("CART_002", "stock insufficient"),

    ORDER_NOT_FOUND("ORDER_001", "order not found"),
    ORDER_STATUS_INVALID("ORDER_002", "order status invalid"),
    ORDER_STOCK_INSUFFICIENT("ORDER_003", "stock insufficient"),
    ORDER_PRODUCT_OFF_SHELF("ORDER_004", "product off shelf"),
    ORDER_CART_EMPTY("ORDER_005", "cart is empty"),

    PAY_ORDER_NOT_FOUND("PAY_001", "order not found"),
    PAY_STATUS_INVALID("PAY_002", "order status invalid for payment"),
    PAY_CHANNEL_UNSUPPORTED("PAY_003", "payment channel unsupported"),
    PAY_AMOUNT_MISMATCH("PAY_004", "payment amount mismatch"),
    PAY_SIGN_INVALID("PAY_005", "payment sign invalid"),
    PAY_ALREADY_PROCESSED("PAY_006", "payment already processed"),

    REFUND_AMOUNT_EXCEED("REFUND_001", "refund amount exceed"),
    REFUND_STATUS_INVALID("REFUND_002", "refund status invalid"),

    SECKILL_ACTIVITY_NOT_FOUND("SECKILL_001", "seckill activity not found"),
    SECKILL_ACTIVITY_NOT_STARTED("SECKILL_002", "seckill activity not started or already ended"),
    SECKILL_STOCK_INSUFFICIENT("SECKILL_003", "seckill stock insufficient"),
    SECKILL_ALREADY_PARTICIPATED("SECKILL_004", "already participated"),
    SECKILL_RATE_LIMIT("SECKILL_005", "rate limit, please try again later"),

    RATE_LIMIT_EXCEEDED("FLOW_001", "rate limit exceeded"),
    CIRCUIT_BREAKER_OPEN("FLOW_002", "circuit breaker open"),
    SERVICE_DEGRADED("FLOW_003", "service degraded");

    private final String code;
    private final String msg;

    ResultCode(String code, String msg) {
        this.code = code;
        this.msg = msg;
    }
}
