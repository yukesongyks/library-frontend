package com.mall.api.request;

import lombok.Data;

@Data
public class CartAddRequest {
    private Long skuId;
    private Integer quantity;
}
