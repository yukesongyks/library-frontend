package com.mall.pay.mapper;

import com.mall.pay.entity.PayAccountDO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

/**
 * 支付账号配置Mapper
 */
@Mapper
public interface PayAccountMapper {

    /**
     * 根据支付渠道查询配置
     */
    PayAccountDO selectByChannel(@Param("channel") String channel);

    /**
     * 插入支付账号配置
     */
    int insert(PayAccountDO payAccount);
}
