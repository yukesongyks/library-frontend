package com.mall.common.constants;

public final class RedisKeys {
    private RedisKeys() {}

    public static final String PRODUCT_LIST = "product:list:";
    public static final String PRODUCT_DETAIL = "product:detail:";
    public static final String CART = "cart:";
    public static final String STOCK = "stock:";
    public static final String SECKILL_STOCK = "seckill:stock:";
    public static final String SECKILL_USER = "seckill:user:";
    public static final String RATE_LIMIT = "rate:limit:";
    public static final String ORDER_LOCK = "order:lock:";
    public static final String STOCK_LOCK = "stock:lock:";
}
