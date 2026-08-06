package com.antgroup.library.algo.service;

import com.antgroup.library.algo.common.BizException;
import com.antgroup.library.algo.common.ResultCode;
import com.antgroup.library.algo.dto.BubbleSortResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * 冒泡排序服务：复制数组 → 执行冒泡排序 → 返回排序结果 + 比较次数/交换次数。
 *
 * @author DTCoder
 */
@Slf4j
@Service
public class BubbleSortService {

    @Value("${algo.bubble-sort.max-array-size:10000}")
    private int maxArraySize;

    /**
     * 对输入整数列表执行冒泡排序。
     *
     * @param numbers 待排序列表
     * @return BubbleSortResponse 含 sorted / comparisons / swaps
     */
    public BubbleSortResponse bubbleSort(List<Integer> numbers) {
        if (numbers.size() > maxArraySize) {
            throw new BizException(ResultCode.ARRAY_TOO_LARGE,
                    "数组超出长度限制(最大 " + maxArraySize + " 个元素)");
        }
        // 复制数组，避免污染入参
        int[] arr = numbers.stream().mapToInt(Integer::intValue).toArray();
        int n = arr.length;
        int comparisons = 0;
        int swaps = 0;
        for (int i = 0; i < n - 1; i++) {
            boolean swapped = false;
            for (int j = 0; j < n - 1 - i; j++) {
                comparisons++;
                if (arr[j] > arr[j + 1]) {
                    int tmp = arr[j];
                    arr[j] = arr[j + 1];
                    arr[j + 1] = tmp;
                    swaps++;
                    swapped = true;
                }
            }
            if (!swapped) {
                break;
            }
        }
        List<Integer> sorted = new java.util.ArrayList<>(n);
        for (int v : arr) {
            sorted.add(v);
        }
        return new BubbleSortResponse(sorted, comparisons, swaps);
    }
}
