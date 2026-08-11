package com.mall.mq.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 消息发送记录表
 */
@Data
public class MqMessageRecordDO {
    /**
     * 系统自增主键
     */
    private Long id;

    /**
     * Topic名称
     */
    private String topic;

    /**
     * Tag
     */
    private String tag;

    /**
     * 消息Key
     */
    private String messageKey;

    /**
     * 消息内容
     */
    private String messageBody;

    /**
     * 消息状态
     */
    private Integer messageStatus;

    /**
     * 重试次数
     */
    private Integer retryCount;

    /**
     * 创建时间
     */
    private LocalDateTime gmtCreate;

    /**
     * 修改时间
     */
    private LocalDateTime gmtModified;
}
