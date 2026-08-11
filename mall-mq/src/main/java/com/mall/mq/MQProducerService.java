package com.mall.mq;

import com.mall.api.entity.MqMessageRecord;
import com.mall.common.enums.MessageStatus;
import com.mall.common.util.JsonUtil;
import com.mall.dao.mapper.MqMessageRecordMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.rocketmq.spring.core.RocketMQTemplate;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.stereotype.Service;

@Slf4j
@Service
@RequiredArgsConstructor
public class MQProducerService {

    private final RocketMQTemplate rocketMQTemplate;
    private final MqMessageRecordMapper mqMessageRecordMapper;

    public void sendMessage(String topic, String tag, String key, Object message) {
        String body = JsonUtil.toJson(message);
        log.info("Send MQ message, topic={}, tag={}, key={}", topic, tag, key);

        MqMessageRecord record = new MqMessageRecord();
        record.setTopic(topic);
        record.setTag(tag);
        record.setMessageKey(key);
        record.setMessageBody(body);
        record.setMessageStatus(MessageStatus.PENDING.getCode());
        mqMessageRecordMapper.insert(record);

        try {
            rocketMQTemplate.syncSend(topic, MessageBuilder.withPayload(body).build());
            record.setMessageStatus(MessageStatus.SENT.getCode());
        } catch (Exception e) {
            log.error("Send MQ message failed, topic={}", topic, e);
            record.setMessageStatus(MessageStatus.SEND_FAILED.getCode());
            record.setRetryCount(record.getRetryCount() + 1);
        }
        mqMessageRecordMapper.updateById(record);
    }

    public void sendDelayMessage(String topic, String tag, String key, Object message, int delayLevel) {
        String body = JsonUtil.toJson(message);
        log.info("Send delay MQ message, topic={}, tag={}, key={}, delayLevel={}", topic, tag, key, delayLevel);

        MqMessageRecord record = new MqMessageRecord();
        record.setTopic(topic);
        record.setTag(tag);
        record.setMessageKey(key);
        record.setMessageBody(body);
        record.setMessageStatus(MessageStatus.PENDING.getCode());
        mqMessageRecordMapper.insert(record);

        try {
            rocketMQTemplate.syncSend(topic, MessageBuilder.withPayload(body).build(), 3000, delayLevel);
            record.setMessageStatus(MessageStatus.SENT.getCode());
        } catch (Exception e) {
            log.error("Send delay MQ message failed, topic={}", topic, e);
            record.setMessageStatus(MessageStatus.SEND_FAILED.getCode());
            record.setRetryCount(record.getRetryCount() + 1);
        }
        mqMessageRecordMapper.updateById(record);
    }
}
