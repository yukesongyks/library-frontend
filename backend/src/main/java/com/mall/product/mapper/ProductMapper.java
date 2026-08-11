package com.mall.product.mapper;

import com.mall.product.entity.ProductDO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 商品Mapper
 */
@Mapper
public interface ProductMapper {

    /**
     * 根据ID查询商品
     */
    ProductDO selectById(@Param("id") Long id);

    /**
     * 分页查询商品列表
     */
    List<ProductDO> selectProductList(@Param("categoryId") Long categoryId,
                                       @Param("offset") int offset,
                                       @Param("pageSize") int pageSize);

    /**
     * 查询商品总数
     */
    long countProductList(@Param("categoryId") Long categoryId);

    /**
     * 根据关键词搜索商品
     */
    List<ProductDO> searchByKeyword(@Param("keyword") String keyword);
}
