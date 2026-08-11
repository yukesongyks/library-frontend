package com.mall.web.controller;

import com.mall.common.result.Result;
import com.mall.pay.PayService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/openapi/pay")
@RequiredArgsConstructor
public class PayCallbackController {

    private final PayService payService;

    @PostMapping("/callback/{channel}")
    public Result<Void> handlePayCallback(@PathVariable String channel, @RequestBody Map<String, String> params) {
        log.info("Receive pay callback, channel={}, params={}", channel, params);
        payService.handlePayCallback(channel, params);
        return Result.success();
    }
}
