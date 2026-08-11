package com.mall.product.mapper;

import com.mall.product.entity.SkuInfoDO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * SKU Mapper
 */
@Mapper
public interface SkuInfoMapper {

    /**
     * 根据ID查询SKU
     */
    SkuInfoDO selectById(@Param("id") Long id);

    /**
     * 根据商品ID查询SKU列表
     */
    List<SkuInfoDO> selectByProductId(@Param("productId") Long productId);

    /**
     * 扣减库存
     */
    int deductStock(@Param("id") Long id, @Param("quantity") Integer quantity);

    /**
     * 释放库存
     */
    int releaseStock(@Param("id") Long id, @Param("quantity") Integer quantity);
}
