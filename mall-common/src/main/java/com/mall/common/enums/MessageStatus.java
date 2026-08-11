package com.mall.common.enums;

import lombok.Getter;

@Getter
public enum MessageStatus {
    PENDING(0, "待发送"),
    SENT(1, "已发送"),
    SEND_FAILED(2, "发送失败"),
    CONSUMED(3, "已消费"),
    CONSUME_FAILED(4, "消费失败");

    private final int code;
    private final String desc;

    MessageStatus(int code, String desc) {
        this.code = code;
        this.desc = desc;
    }
}
