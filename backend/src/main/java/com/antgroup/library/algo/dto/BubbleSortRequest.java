package com.antgroup.library.algo.dto;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

/**
 * 冒泡排序请求体。
 *
 * @author DTCoder
 */
@Data
public class BubbleSortRequest {

    @NotEmpty(message = "待排序数组不能为空")
    private List<Integer> numbers;
}
