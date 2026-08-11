package com.mall.common.exception;

import com.mall.common.result.Result;
import com.mall.common.result.ResultCode;
import lombok.extern.slf4j.Slf4j;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(MallException.class)
    public Result<Void> handleMallException(MallException e) {
        log.warn("Business exception: {}", e.getMessage());
        return Result.error(e.getResultCode());
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public Result<Void> handleIllegalArgumentException(IllegalArgumentException e) {
        log.warn("Param exception: {}", e.getMessage());
        return Result.error(ResultCode.PARAM_ERROR);
    }

    @ExceptionHandler(Exception.class)
    public Result<Void> handleException(Exception e) {
        log.error("System exception: ", e);
        return Result.error(ResultCode.SYSTEM_ERROR);
    }
}
