package com.mall.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;

import java.util.concurrent.TimeUnit;

@Slf4j
@Service
@RequiredArgsConstructor
public class FlowControlService {

    private final RedisTemplate<String, Object> redisTemplate;

    public boolean checkRateLimit(String key, int limit, int windowSeconds) {
        String redisKey = "rate:limit:" + key;
        Long current = redisTemplate.opsForValue().increment(redisKey);
        if (current == 1) {
            redisTemplate.expire(redisKey, windowSeconds, TimeUnit.SECONDS);
        }
        return current <= limit;
    }

    public boolean checkUserRateLimit(Long userId, String api, int limit, int windowSeconds) {
        String key = userId + ":" + api;
        return checkRateLimit(key, limit, windowSeconds);
    }
}
