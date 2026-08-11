package com.mall.cart.service;

import com.mall.cart.entity.CartItemDO;

import java.util.List;

/**
 * 购物车服务接口
 */
public interface CartService {

    /**
     * 添加商品到购物车
     */
    void addToCart(Long userId, Long skuId, Integer quantity);

    /**
     * 更新购物车商品数量
     */
    void updateCartItemQuantity(Long userId, Long cartItemId, Integer quantity);

    /**
     * 删除购物车项
     */
    void deleteCartItem(Long userId, Long cartItemId);

    /**
     * 查询用户购物车列表
     */
    List<CartItemDO> listCartItems(Long userId);

    /**
     * 根据ID列表批量查询购物车项
     */
    List<CartItemDO> getCartItemsByIds(List<Long> ids);
}
