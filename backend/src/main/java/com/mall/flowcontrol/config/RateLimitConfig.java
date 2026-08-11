package com.mall.flowcontrol.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 限流配置
 */
@Configuration
public class RateLimitConfig {

    /**
     * 接口限流计数器
     */
    @Bean
    public ConcurrentHashMap<String, AtomicInteger> rateLimitCounter() {
        return new ConcurrentHashMap<>();
    }
}
