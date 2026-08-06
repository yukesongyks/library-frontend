package com.antgroup.library.algo.service;

import com.antgroup.library.algo.dto.HelloResponse;
import org.springframework.stereotype.Service;

/**
 * HelloWorld 服务：无状态，直接返回常量问候语。
 *
 * @author DTCoder
 */
@Service
public class HelloWorldService {

    private static final String HELLO_MESSAGE = "Hello, World!";

    /**
     * 返回固定问候语。
     *
     * @return HelloResponse
     */
    public HelloResponse helloWorld() {
        return new HelloResponse(HELLO_MESSAGE);
    }
}
