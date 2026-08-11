package com.mall.product.dto;

import jakarta.validation.constraints.Min;
import lombok.Data;

/**
 * 商品列表查询请求
 */
@Data
public class ProductListRequest {
    @Min(value = 1, message = "页码不能小于1")
    private int pageNum = 1;

    @Min(value = 1, message = "每页数量不能小于1")
    private int pageSize = 10;

    private Long categoryId;
}
