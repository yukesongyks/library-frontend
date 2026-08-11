package com.mall.common.enums;

import lombok.Getter;

/**
 * 消息状态枚举
 */
@Getter
public enum MessageStatus {
    /**
     * 待发送
     */
    PENDING(0, "待发送"),
    /**
     * 已发送
     */
    SENT(1, "已发送"),
    /**
     * 发送失败
     */
    SEND_FAILED(2, "发送失败"),
    /**
     * 已消费
     */
    CONSUMED(3, "已消费"),
    /**
     * 消费失败
     */
    CONSUME_FAILED(4, "消费失败");

    private final int code;
    private final String desc;

    MessageStatus(int code, String desc) {
        this.code = code;
        this.desc = desc;
    }
}
