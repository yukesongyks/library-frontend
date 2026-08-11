package com.mall.flowcontrol.annotation;

import java.lang.annotation.*;

/**
 * 限流注解
 */
@Target(ElementType.METHOD)
@Retention(RetentionPolicy.RUNTIME)
@Documented
public @interface RateLimit {
    /**
     * 限流key
     */
    String key() default "";

    /**
     * 限流阈值（每秒请求数）
     */
    int limit() default 100;

    /**
     * 限流时间窗口（秒）
     */
    int window() default 1;
}
