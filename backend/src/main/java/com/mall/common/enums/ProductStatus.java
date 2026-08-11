package com.mall.common.enums;

import lombok.Getter;

/**
 * 商品状态枚举
 */
@Getter
public enum ProductStatus {
    /**
     * 上架
     */
    ON_SALE(1, "上架"),
    /**
     * 下架
     */
    OFF_SALE(2, "下架");

    private final int code;
    private final String desc;

    ProductStatus(int code, String desc) {
        this.code = code;
        this.desc = desc;
    }
}
