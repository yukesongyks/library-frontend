package com.antgroup.library.algo.common;

import lombok.Getter;

/**
 * 业务异常，用于在 Service 层抛出可预期的错误。
 *
 * @author DTCoder
 */
@Getter
public class BizException extends RuntimeException {

    private static final long serialVersionUID = 1L;

    private final ResultCode resultCode;

    public BizException(ResultCode resultCode) {
        super(resultCode.getMessage());
        this.resultCode = resultCode;
    }

    public BizException(ResultCode resultCode, String message) {
        super(message);
        this.resultCode = resultCode;
    }
}
