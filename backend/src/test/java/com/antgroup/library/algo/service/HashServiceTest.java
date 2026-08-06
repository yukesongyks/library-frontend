package com.antgroup.library.algo.service;

import com.antgroup.library.algo.common.BizException;
import com.antgroup.library.algo.dto.HashResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * 哈希算法服务单元测试。
 * 覆盖正确性（对比已知 SHA-256）与输入长度限制。
 *
 * @author DTCoder
 */
class HashServiceTest {

    private HashService hashService;

    @BeforeEach
    void setUp() {
        hashService = new HashService();
        ReflectionTestUtils.setField(hashService, "maxInputBytes", 10240);
    }

    @Test
    @DisplayName("标准输入-应返回正确的SHA-256哈希值")
    void computeHash_standardInput() {
        HashResponse resp = hashService.computeHash("test-string");

        assertEquals("SHA-256", resp.getAlgorithm());
        assertEquals("a591a6d40bf420404a011733cfb7b190d62c65bf0bcda32b57b277d9ad9f146e",
                resp.getHashValue());
    }

    @Test
    @DisplayName("空字符串-应返回64位十六进制哈希")
    void computeHash_emptyString() {
        HashResponse resp = hashService.computeHash("");

        assertNotNull(resp.getHashValue());
        assertEquals(64, resp.getHashValue().length(), "SHA-256 哈希应为64位十六进制字符");
        assertTrue(resp.getHashValue().matches("[0-9a-f]{64}"));
    }

    @Test
    @DisplayName("超长输入-应抛出BizException")
    void computeHash_inputTooLarge() {
        ReflectionTestUtils.setField(hashService, "maxInputBytes", 4);
        String tooLong = "aaaaaaaaaa";

        assertThrows(BizException.class, () -> hashService.computeHash(tooLong));
    }
}
