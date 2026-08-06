package com.antgroup.library.algo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

import java.util.List;

/**
 * 冒泡排序响应体。
 *
 * @author DTCoder
 */
@Data
@AllArgsConstructor
public class BubbleSortResponse {

    /** 排序后数组 */
    private List<Integer> sorted;

    /** 比较次数 */
    private int comparisons;

    /** 交换次数 */
    private int swaps;
}
