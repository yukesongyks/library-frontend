package com.mall.common.response;

import lombok.Data;

/**
 * 通用API响应
 */
@Data
public class ApiResponse<T> {

    private static final String SUCCESS_CODE = "000000";
    private static final String SUCCESS_MSG = "success";

    private String code;
    private String msg;
    private T data;

    public static <T> ApiResponse<T> success(T data) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(SUCCESS_CODE);
        response.setMsg(SUCCESS_MSG);
        response.setData(data);
        return response;
    }

    public static <T> ApiResponse<T> success() {
        return success(null);
    }

    public static <T> ApiResponse<T> error(String code, String msg) {
        ApiResponse<T> response = new ApiResponse<>();
        response.setCode(code);
        response.setMsg(msg);
        return response;
    }
}
