package com.mall.mq.mapper;

import com.mall.mq.entity.MqMessageRecordDO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * MQ消息记录Mapper
 */
@Mapper
public interface MqMessageRecordMapper {

    /**
     * 根据ID查询消息记录
     */
    MqMessageRecordDO selectById(@Param("id") Long id);

    /**
     * 根据消息Key查询消息记录
     */
    MqMessageRecordDO selectByMessageKey(@Param("messageKey") String messageKey);

    /**
     * 插入消息记录
     */
    int insert(MqMessageRecordDO record);

    /**
     * 更新消息状态
     */
    int updateMessageStatus(@Param("id") Long id,
                            @Param("messageStatus") Integer messageStatus);

    /**
     * 增加重试次数
     */
    int incrementRetryCount(@Param("id") Long id);

    /**
     * 查询待发送的消息列表
     */
    List<MqMessageRecordDO> selectPendingMessages(@Param("limit") int limit);
}
