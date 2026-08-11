package com.mall.web.controller;

import com.mall.api.entity.MallOrder;
import com.mall.api.request.OrderCreateRequest;
import com.mall.common.result.Result;
import com.mall.service.OrderService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/order")
@RequiredArgsConstructor
public class OrderController {

    private final OrderService orderService;

    @PostMapping("/create")
    public Result<MallOrder> createOrder(@RequestParam Long userId, @RequestBody OrderCreateRequest request) {
        return Result.success(orderService.createOrder(userId, request));
    }

    @GetMapping("/detail/{id}")
    public Result<MallOrder> getOrderDetail(@PathVariable Long id) {
        return Result.success(orderService.getOrderDetail(id));
    }

    @GetMapping("/list")
    public Result<List<MallOrder>> getOrderList(@RequestParam Long userId) {
        return Result.success(orderService.getOrderList(userId));
    }

    @PostMapping("/cancel")
    public Result<Void> cancelOrder(@RequestParam Long userId, @RequestParam Long orderId) {
        orderService.cancelOrder(userId, orderId);
        return Result.success();
    }
}
