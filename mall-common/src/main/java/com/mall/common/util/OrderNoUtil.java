package com.mall.common.util;

import java.time.LocalDateTime;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;

public final class OrderNoUtil {
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final SnowflakeIdUtil SNOWFLAKE = SnowflakeIdUtil.getInstance();
    private static final ZoneId SHANGHAI_ZONE = ZoneId.of("Asia/Shanghai");

    private OrderNoUtil() {}

    public static String generateOrderNo() {
        return "O" + LocalDateTime.now(SHANGHAI_ZONE).format(FORMATTER) + SNOWFLAKE.nextIdStr();
    }

    public static String generatePayNo() {
        return "P" + LocalDateTime.now(SHANGHAI_ZONE).format(FORMATTER) + SNOWFLAKE.nextIdStr();
    }

    public static String generateRefundNo() {
        return "R" + LocalDateTime.now(SHANGHAI_ZONE).format(FORMATTER) + SNOWFLAKE.nextIdStr();
    }
}
