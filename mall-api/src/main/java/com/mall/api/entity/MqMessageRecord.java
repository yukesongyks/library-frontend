package com.mall.api.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("mq_message_record")
public class MqMessageRecord {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String topic;
    private String tag;
    private String messageKey;
    private String messageBody;
    private Integer messageStatus;
    private Integer retryCount;
    private LocalDateTime gmtCreate;
    private LocalDateTime gmtModified;
}
