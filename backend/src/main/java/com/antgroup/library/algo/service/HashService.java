package com.antgroup.library.algo.service;

import com.antgroup.library.algo.common.BizException;
import com.antgroup.library.algo.common.ResultCode;
import com.antgroup.library.algo.dto.HashResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

/**
 * 哈希算法服务：输入字符串 → SHA-256 字节数组 → Hex 编码字符串。
 *
 * @author DTCoder
 */
@Slf4j
@Service
public class HashService {

    private static final String ALGORITHM = "SHA-256";

    @Value("${algo.hash.max-input-bytes:10240}")
    private int maxInputBytes;

    /**
     * 计算输入字符串的 SHA-256 哈希值。
     *
     * @param input 原始字符串
     * @return HashResponse 含 hashValue 与 algorithm
     */
    public HashResponse computeHash(String input) {
        byte[] bytes = input.getBytes(StandardCharsets.UTF_8);
        if (bytes.length > maxInputBytes) {
            throw new BizException(ResultCode.INPUT_TOO_LARGE,
                    "输入超出长度限制(最大 " + maxInputBytes + " 字节)");
        }
        try {
            MessageDigest digest = MessageDigest.getInstance(ALGORITHM);
            byte[] hashBytes = digest.digest(bytes);
            return new HashResponse(bytesToHex(hashBytes), ALGORITHM);
        } catch (NoSuchAlgorithmException e) {
            log.error("哈希算法不可用: {}", ALGORITHM, e);
            throw new BizException(ResultCode.INTERNAL_ERROR, "哈希算法不可用");
        }
    }

    /**
     * 字节数组转十六进制字符串(小写)。
     */
    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder(bytes.length * 2);
        for (byte b : bytes) {
            sb.append(String.format("%02x", b));
        }
        return sb.toString();
    }
}
