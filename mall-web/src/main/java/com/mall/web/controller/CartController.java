package com.mall.web.controller;

import com.mall.api.entity.CartItem;
import com.mall.api.request.CartAddRequest;
import com.mall.common.result.Result;
import com.mall.service.CartService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/cart")
@RequiredArgsConstructor
public class CartController {

    private final CartService cartService;

    @PostMapping("/add")
    public Result<Void> addToCart(@RequestParam Long userId, @RequestBody CartAddRequest request) {
        cartService.addToCart(userId, request.getSkuId(), request.getQuantity());
        return Result.success();
    }

    @GetMapping("/list")
    public Result<List<CartItem>> getCartList(@RequestParam Long userId) {
        return Result.success(cartService.getCartList(userId));
    }

    @PostMapping("/update")
    public Result<Void> updateCartItem(@RequestParam Long userId, @RequestParam Long cartItemId, @RequestParam Integer quantity) {
        cartService.updateCartItem(userId, cartItemId, quantity);
        return Result.success();
    }

    @PostMapping("/delete")
    public Result<Void> deleteCartItem(@RequestParam Long userId, @RequestParam Long cartItemId) {
        cartService.deleteCartItem(userId, cartItemId);
        return Result.success();
    }
}
