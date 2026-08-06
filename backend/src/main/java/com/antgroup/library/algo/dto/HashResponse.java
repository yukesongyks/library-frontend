package com.antgroup.library.algo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * 哈希算法响应体。
 *
 * @author DTCoder
 */
@Data
@AllArgsConstructor
public class HashResponse {

    private String hashValue;
    private String algorithm;
}
