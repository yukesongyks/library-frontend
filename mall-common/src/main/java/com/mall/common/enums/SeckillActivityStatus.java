package com.mall.common.enums;

import lombok.Getter;

@Getter
public enum SeckillActivityStatus {
    NOT_STARTED(0, "未开始"),
    IN_PROGRESS(1, "进行中"),
    ENDED(2, "已结束");

    private final int code;
    private final String desc;

    SeckillActivityStatus(int code, String desc) {
        this.code = code;
        this.desc = desc;
    }
}
