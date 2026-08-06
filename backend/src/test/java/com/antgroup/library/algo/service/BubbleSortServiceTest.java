package com.antgroup.library.algo.service;

import com.antgroup.library.algo.dto.BubbleSortResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 冒泡排序服务单元测试。
 * 覆盖系分验证策略：空数组、单元素、逆序、全相同、常规。
 *
 * @author DTCoder
 */
class BubbleSortServiceTest {

    private BubbleSortService bubbleSortService;

    @BeforeEach
    void setUp() {
        bubbleSortService = new BubbleSortService();
        ReflectionTestUtils.setField(bubbleSortService, "maxArraySize", 10000);
    }

    @Test
    @DisplayName("常规数组-应正确排序并返回统计值")
    void bubbleSort_normalCase() {
        List<Integer> input = Arrays.asList(64, 34, 25, 12, 22, 11, 90);
        BubbleSortResponse resp = bubbleSortService.bubbleSort(input);

        assertEquals(Arrays.asList(11, 12, 22, 25, 34, 64, 90), resp.getSorted());
        assertTrue(resp.getComparisons() > 0, "比较次数应大于0");
        assertTrue(resp.getSwaps() > 0, "交换次数应大于0");
    }

    @Test
    @DisplayName("空数组-应返回空列表且零比较零交换")
    void bubbleSort_emptyArray() {
        BubbleSortResponse resp = bubbleSortService.bubbleSort(Collections.emptyList());

        assertTrue(resp.getSorted().isEmpty());
        assertEquals(0, resp.getComparisons());
        assertEquals(0, resp.getSwaps());
    }

    @Test
    @DisplayName("单元素数组-应原样返回且零比较零交换")
    void bubbleSort_singleElement() {
        BubbleSortResponse resp = bubbleSortService.bubbleSort(Collections.singletonList(42));

        assertEquals(Collections.singletonList(42), resp.getSorted());
        assertEquals(0, resp.getComparisons());
        assertEquals(0, resp.getSwaps());
    }

    @Test
    @DisplayName("逆序数组-应转为升序且交换次数最大")
    void bubbleSort_reverseOrder() {
        List<Integer> input = Arrays.asList(5, 4, 3, 2, 1);
        BubbleSortResponse resp = bubbleSortService.bubbleSort(input);

        assertEquals(Arrays.asList(1, 2, 3, 4, 5), resp.getSorted());
        // 5 个元素的逆序，交换次数为 10（4+3+2+1）
        assertEquals(10, resp.getSwaps());
    }

    @Test
    @DisplayName("全相同数组-应原样返回且零交换")
    void bubbleSort_allSame() {
        List<Integer> input = Arrays.asList(7, 7, 7, 7);
        BubbleSortResponse resp = bubbleSortService.bubbleSort(input);

        assertEquals(input, resp.getSorted());
        assertEquals(0, resp.getSwaps());
        assertTrue(resp.getComparisons() > 0, "比较次数应大于0");
    }

    @Test
    @DisplayName("入参不被污染-原列表保持不变")
    void bubbleSort_inputNotMutated() {
        List<Integer> input = Arrays.asList(3, 1, 2);
        List<Integer> snapshot = List.copyOf(input);

        bubbleSortService.bubbleSort(input);

        assertEquals(snapshot, input, "入参列表不应被修改");
    }
}
