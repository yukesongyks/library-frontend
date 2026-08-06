package com.antgroup.library.algo.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * 哈希算法请求体。
 *
 * @author DTCoder
 */
@Data
public class HashRequest {

    @NotBlank(message = "输入字符串不能为空")
    private String input;
}
