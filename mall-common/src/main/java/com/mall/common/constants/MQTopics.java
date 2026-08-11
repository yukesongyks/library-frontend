package com.mall.common.constants;

public final class MQTopics {
    private MQTopics() {}

    public static final String ORDER_DELAY = "order-delay";
    public static final String ORDER_PAY_SUCCESS = "order-pay-success";
    public static final String SECKILL_ORDER_CREATE = "seckill-order-create";
    public static final String STOCK_SYNC = "stock-sync";
}
