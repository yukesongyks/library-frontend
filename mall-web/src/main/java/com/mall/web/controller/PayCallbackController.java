package com.mall.web.controller;

import com.mall.common.result.Result;
import com.mall.common.result.ResultCode;
import com.mall.common.exception.MallException;
import com.mall.pay.PayChannelService;
import com.mall.pay.PayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;
import java.util.concurrent.TimeUnit;

@Slf4j
@RestController
@RequestMapping("/openapi/pay")
@RequiredArgsConstructor
public class PayCallbackController {

    private final PayService payService;
    private final PayChannelService alipayChannelService;
    private final PayChannelService wechatPayChannelService;
    private final RedisTemplate<String, Object> redisTemplate;

    private static final String PAY_CALLBACK_IDEMPOTENT_KEY = "pay:callback:idempotent:";

    @PostMapping("/callback/{channel}")
    public Result<Void> handlePayCallback(@PathVariable String channel, @RequestBody Map<String, String> params) {
        log.info("Receive pay callback, channel={}, params={}", channel, params);

        PayChannelService channelService = getChannelService(channel);
        if (!channelService.verifyCallback(params)) {
            log.error("Pay callback signature verification failed, channel={}, params={}", channel, params);
            throw new MallException(ResultCode.PAY_SIGNATURE_INVALID);
        }

        String payNo = params.get("out_trade_no");
        if (payNo == null || payNo.isEmpty()) {
            log.error("Pay callback missing out_trade_no, channel={}, params={}", channel, params);
            throw new MallException(ResultCode.PAY_ORDER_NOT_FOUND);
        }

        String idempotentKey = PAY_CALLBACK_IDEMPOTENT_KEY + payNo + ":" + channel;
        Boolean success = redisTemplate.opsForValue().setIfAbsent(idempotentKey, "1", 24, TimeUnit.HOURS);
        if (Boolean.FALSE.equals(success)) {
            log.warn("Duplicate pay callback, skip processing. payNo={}, channel={}", payNo, channel);
            return Result.success();
        }

        payService.handlePayCallback(channel, params);
        log.info("Pay callback processed successfully, payNo={}, channel={}", payNo, channel);
        return Result.success();
    }

    private PayChannelService getChannelService(String channel) {
        if ("alipay".equalsIgnoreCase(channel)) {
            return alipayChannelService;
        } else if ("wechat".equalsIgnoreCase(channel)) {
            return wechatPayChannelService;
        }
        throw new MallException(ResultCode.PAY_CHANNEL_UNSUPPORTED);
    }
}
