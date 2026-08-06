package com.antgroup.library.algo.enums;

import lombok.Getter;

/**
 * 导出数据类型枚举（白名单，禁止反射/动态类加载）。
 *
 * @author DTCoder
 */
@Getter
public enum ExportType {

    HELLO("hello_result"),
    HASH("hash_result"),
    BUBBLE_SORT("bubble_sort_result");

    private final String fileNamePrefix;

    ExportType(String fileNamePrefix) {
        this.fileNamePrefix = fileNamePrefix;
    }
}
