package com.mall.web.controller;

import com.mall.common.result.Result;
import com.mall.common.result.ResultCode;
import com.mall.common.exception.MallException;
import com.mall.pay.PayChannelService;
import com.mall.pay.PayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/openapi/pay")
@RequiredArgsConstructor
public class PayCallbackController {

    private final PayService payService;
    private final PayChannelService alipayChannelService;
    private final PayChannelService wechatPayChannelService;

    @PostMapping("/callback/{channel}")
    public Result<Void> handlePayCallback(@PathVariable String channel, @RequestBody Map<String, String> params) {
        log.info("Receive pay callback, channel={}, params={}", channel, params);

        PayChannelService channelService = getChannelService(channel);
        if (!channelService.verifyCallback(params)) {
            log.error("Pay callback signature verification failed, channel={}, params={}", channel, params);
            throw new MallException(ResultCode.PAY_SIGNATURE_INVALID);
        }

        payService.handlePayCallback(channel, params);
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
