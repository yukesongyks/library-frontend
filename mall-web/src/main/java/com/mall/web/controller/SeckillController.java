package com.mall.web.controller;

import com.mall.api.entity.SeckillActivity;
import com.mall.common.result.Result;
import com.mall.service.SeckillService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/seckill")
@RequiredArgsConstructor
public class SeckillController {

    private final SeckillService seckillService;

    @GetMapping("/activities")
    public Result<List<SeckillActivity>> listActivities() {
        return Result.success(seckillService.listActivities());
    }

    @PostMapping("/order")
    public Result<String> createSeckillOrder(@RequestParam Long userId, @RequestParam Long activityId, @RequestParam Long skuId) {
        return Result.success(seckillService.createSeckillOrder(activityId, userId, skuId));
    }
}
