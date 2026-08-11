package com.mall.web.controller;

import com.mall.api.entity.PayRecord;
import com.mall.api.entity.RefundRecord;
import com.mall.api.request.PayCreateRequest;
import com.mall.api.request.RefundRequest;
import com.mall.common.result.Result;
import com.mall.pay.PayService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/pay")
@RequiredArgsConstructor
public class PayController {

    private final PayService payService;

    @PostMapping("/create")
    public Result<PayRecord> createPay(@RequestBody PayCreateRequest request) {
        return Result.success(payService.createPay(request.getOrderId(), request.getChannel()));
    }

    @GetMapping("/query/{orderId}")
    public Result<PayRecord> queryPay(@PathVariable Long orderId) {
        return Result.success(new PayRecord());
    }

    @PostMapping("/refund")
    public Result<RefundRecord> applyRefund(@RequestBody RefundRequest request) {
        return Result.success(payService.applyRefund(request.getOrderId(), request.getAmount(), request.getReason()));
    }
}
