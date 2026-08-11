package com.mall.common.exception;

import com.mall.common.result.ResultCode;
import lombok.Getter;

@Getter
public class MallException extends RuntimeException {
    private final ResultCode resultCode;

    public MallException(ResultCode resultCode) {
        super(resultCode.getMsg());
        this.resultCode = resultCode;
    }

    public MallException(ResultCode resultCode, String message) {
        super(message);
        this.resultCode = resultCode;
    }
}
