package com.antgroup.library.algo.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.util.Map;

/**
 * 导出请求体。
 *
 * @author DTCoder
 */
@Data
public class ExportRequest {

    /** 导出数据类型：HELLO / HASH / BUBBLE_SORT */
    @NotNull(message = "导出类型不能为空")
    private String type;

    /** 导出格式：CSV / EXCEL */
    @NotNull(message = "导出格式不能为空")
    private String format;

    /** 当前 Tab 的结果数据，由前端透传 */
    @NotNull(message = "导出数据不能为空")
    private Map<String, Object> data;
}
