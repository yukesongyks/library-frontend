package com.antgroup.library.algo.common;

import lombok.Getter;

/**
 * 错误码枚举，集中管理业务异常码。
 *
 * @author DTCoder
 */
@Getter
public enum ResultCode {

    SUCCESS(200, "success"),
    PARAM_INVALID(400, "参数无效"),
    EXPORT_FORMAT_NOT_SUPPORTED(406, "不支持的导出格式"),
    EXPORT_TYPE_NOT_SUPPORTED(406, "不支持的导出类型"),
    INPUT_TOO_LARGE(400, "输入超出长度限制"),
    ARRAY_TOO_LARGE(400, "数组超出长度限制"),
    INTERNAL_ERROR(500, "服务内部错误");

    private final int code;
    private final String message;

    ResultCode(int code, String message) {
        this.code = code;
        this.message = message;
    }
}
