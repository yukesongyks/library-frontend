package com.mall.cart.mapper;

import com.mall.cart.entity.CartItemDO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 购物车Mapper
 */
@Mapper
public interface CartItemMapper {

    /**
     * 根据ID查询购物车项
     */
    CartItemDO selectById(@Param("id") Long id);

    /**
     * 根据用户ID查询购物车列表
     */
    List<CartItemDO> selectByUserId(@Param("userId") Long userId);

    /**
     * 根据用户ID和SKU ID查询购物车项
     */
    CartItemDO selectByUserIdAndSkuId(@Param("userId") Long userId, @Param("skuId") Long skuId);

    /**
     * 新增购物车项
     */
    int insert(CartItemDO cartItem);

    /**
     * 更新购物车项数量
     */
    int updateQuantity(@Param("id") Long id, @Param("quantity") Integer quantity);

    /**
     * 删除购物车项
     */
    int deleteById(@Param("id") Long id);

    /**
     * 批量查询购物车项
     */
    List<CartItemDO> selectByIds(@Param("ids") List<Long> ids);
}
