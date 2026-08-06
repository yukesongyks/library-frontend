package com.antgroup.library.algo.dto;

import lombok.AllArgsConstructor;
import lombok.Data;

/**
 * 导出结果封装：文件字节、文件名、Content-Type。
 *
 * @author DTCoder
 */
@Data
@AllArgsConstructor
public class ExportResult {

    private byte[] bytes;
    private String fileName;
    private String contentType;
}
