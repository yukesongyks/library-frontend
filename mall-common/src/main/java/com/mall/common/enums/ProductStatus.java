package com.mall.common.enums;

import lombok.Getter;

@Getter
public enum ProductStatus {
    ON_SHELF(1, "上架"),
    OFF_SHELF(2, "下架");

    private final int code;
    private final String desc;

    ProductStatus(int code, String desc) {
        this.code = code;
        this.desc = desc;
    }
}
