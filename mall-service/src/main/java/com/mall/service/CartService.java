package com.mall.service;

import com.baomidou.mybatisplus.core.conditions.query.LambdaQueryWrapper;
import com.mall.api.entity.CartItem;
import com.mall.api.entity.SkuInfo;
import com.mall.common.exception.MallException;
import com.mall.common.result.ResultCode;
import com.mall.dao.mapper.CartItemMapper;
import com.mall.dao.mapper.SkuInfoMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Slf4j
@Service
@RequiredArgsConstructor
public class CartService {

    private final CartItemMapper cartItemMapper;
    private final SkuInfoMapper skuInfoMapper;

    @Transactional(rollbackFor = Exception.class)
    public void addToCart(Long userId, Long skuId, Integer quantity) {
        SkuInfo skuInfo = skuInfoMapper.selectById(skuId);
        if (skuInfo == null) {
            throw new MallException(ResultCode.CART_ITEM_NOT_FOUND);
        }
        if (skuInfo.getSkuStock() < quantity) {
            throw new MallException(ResultCode.CART_STOCK_INSUFFICIENT);
        }

        LambdaQueryWrapper<CartItem> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CartItem::getUserId, userId).eq(CartItem::getSkuId, skuId);
        CartItem existing = cartItemMapper.selectOne(wrapper);

        if (existing != null) {
            existing.setQuantity(existing.getQuantity() + quantity);
            cartItemMapper.updateById(existing);
        } else {
            CartItem cartItem = new CartItem();
            cartItem.setUserId(userId);
            cartItem.setSkuId(skuId);
            cartItem.setQuantity(quantity);
            cartItemMapper.insert(cartItem);
        }
    }

    public List<CartItem> getCartList(Long userId) {
        LambdaQueryWrapper<CartItem> wrapper = new LambdaQueryWrapper<>();
        wrapper.eq(CartItem::getUserId, userId);
        return cartItemMapper.selectList(wrapper);
    }

    @Transactional(rollbackFor = Exception.class)
    public void updateCartItem(Long userId, Long cartItemId, Integer quantity) {
        CartItem cartItem = cartItemMapper.selectById(cartItemId);
        if (cartItem == null || !cartItem.getUserId().equals(userId)) {
            throw new MallException(ResultCode.CART_ITEM_NOT_FOUND);
        }
        cartItem.setQuantity(quantity);
        cartItemMapper.updateById(cartItem);
    }

    @Transactional(rollbackFor = Exception.class)
    public void deleteCartItem(Long userId, Long cartItemId) {
        CartItem cartItem = cartItemMapper.selectById(cartItemId);
        if (cartItem == null || !cartItem.getUserId().equals(userId)) {
            throw new MallException(ResultCode.CART_ITEM_NOT_FOUND);
        }
        cartItemMapper.deleteById(cartItemId);
    }
}
