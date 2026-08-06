package com.antgroup.library.algo.controller;

import com.antgroup.library.algo.common.Result;
import com.antgroup.library.algo.dto.BubbleSortRequest;
import com.antgroup.library.algo.dto.BubbleSortResponse;
import com.antgroup.library.algo.dto.ExportRequest;
import com.antgroup.library.algo.dto.ExportResult;
import com.antgroup.library.algo.dto.HashRequest;
import com.antgroup.library.algo.dto.HashResponse;
import com.antgroup.library.algo.dto.HelloResponse;
import com.antgroup.library.algo.service.BubbleSortService;
import com.antgroup.library.algo.service.ExportService;
import com.antgroup.library.algo.service.HashService;
import com.antgroup.library.algo.service.HelloWorldService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

/**
 * 算法演示与导出 Controller。
 * 路径前缀：/api/algo
 *
 * @author DTCoder
 */
@Slf4j
@RestController
@RequestMapping("/api/algo")
@RequiredArgsConstructor
public class AlgorithmController {

    private final HelloWorldService helloWorldService;
    private final HashService hashService;
    private final BubbleSortService bubbleSortService;
    private final ExportService exportService;

    /**
     * HelloWorld 接口：基础连通性测试。
     */
    @GetMapping("/hello")
    public Result<HelloResponse> hello() {
        return Result.success(helloWorldService.helloWorld());
    }

    /**
     * 哈希算法接口：接收字符串，返回 SHA-256 哈希值。
     */
    @PostMapping("/hash")
    public Result<HashResponse> hash(@Valid @RequestBody HashRequest request) {
        return Result.success(hashService.computeHash(request.getInput()));
    }

    /**
     * 冒泡排序接口：接收整数数组，返回排序结果及统计。
     */
    @PostMapping("/bubble-sort")
    public Result<BubbleSortResponse> bubbleSort(@Valid @RequestBody BubbleSortRequest request) {
        return Result.success(bubbleSortService.bubbleSort(request.getNumbers()));
    }

    /**
     * 导出接口：根据类型与格式生成文件流。
     */
    @PostMapping("/export")
    public ResponseEntity<byte[]> export(@Valid @RequestBody ExportRequest request) {
        ExportResult result = exportService.exportData(
                request.getType(), request.getFormat(), request.getData());
        String encodedFileName = URLEncoder.encode(result.getFileName(), StandardCharsets.UTF_8)
                .replace("+", "%20");
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.parseMediaType(result.getContentType()));
        headers.set(HttpHeaders.CONTENT_DISPOSITION,
                "attachment; filename=\"" + encodedFileName + "\"; filename*=UTF-8''" + encodedFileName);
        headers.setContentLength(result.getBytes().length);
        return ResponseEntity.ok().headers(headers).body(result.getBytes());
    }
}
