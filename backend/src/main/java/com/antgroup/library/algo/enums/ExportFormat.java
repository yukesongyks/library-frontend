package com.antgroup.library.algo.enums;

import lombok.Getter;

/**
 * 导出格式枚举，预留 JSON/XML 扩展点。
 *
 * @author DTCoder
 */
@Getter
public enum ExportFormat {

    CSV("text/csv", ".csv", "UTF-8"),
    EXCEL("application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", ".xlsx", null);

    private final String contentType;
    private final String fileSuffix;
    private final String charset;

    ExportFormat(String contentType, String fileSuffix, String charset) {
        this.contentType = contentType;
        this.fileSuffix = fileSuffix;
        this.charset = charset;
    }
}
