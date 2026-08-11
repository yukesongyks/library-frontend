package com.mall.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.mall.api.entity.SkuInfo;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface SkuInfoMapper extends BaseMapper<SkuInfo> {

    @Update("UPDATE sku_info SET sku_stock = sku_stock - #{quantity} WHERE id = #{skuId} AND sku_stock >= #{quantity}")
    int deductStock(@Param("skuId") Long skuId, @Param("quantity") Integer quantity);

    @Update("UPDATE sku_info SET sku_stock = sku_stock + #{quantity} WHERE id = #{skuId}")
    int releaseStock(@Param("skuId") Long skuId, @Param("quantity") Integer quantity);
}
