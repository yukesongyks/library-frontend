package com.mall.common.util;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public final class OrderNoUtil {
    private static final DateTimeFormatter FORMATTER = DateTimeFormatter.ofPattern("yyyyMMddHHmmss");
    private static final SnowflakeIdUtil SNOWFLAKE = SnowflakeIdUtil.getInstance();

    private OrderNoUtil() {}

    public static String generateOrderNo() {
        return "O" + LocalDateTime.now().format(FORMATTER) + SNOWFLAKE.nextIdStr();
    }

    public static String generatePayNo() {
        return "P" + LocalDateTime.now().format(FORMATTER) + SNOWFLAKE.nextIdStr();
    }

    public static String generateRefundNo() {
        return "R" + LocalDateTime.now().format(FORMATTER) + SNOWFLAKE.nextIdStr();
    }
}
