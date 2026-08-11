package com.mall.common.enums;

import lombok.Getter;

/**
 * 秒杀活动状态枚举
 */
@Getter
public enum SeckillActivityStatus {
    /**
     * 未开始
     */
    NOT_STARTED(0, "未开始"),
    /**
     * 进行中
     */
    IN_PROGRESS(1, "进行中"),
    /**
     * 已结束
     */
    ENDED(2, "已结束");

    private final int code;
    private final String desc;

    SeckillActivityStatus(int code, String desc) {
        this.code = code;
        this.desc = desc;
    }
}
