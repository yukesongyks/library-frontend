package com.mall.pay.mapper;

import com.mall.pay.entity.PayRecordDO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 支付记录Mapper
 */
@Mapper
public interface PayRecordMapper {

    /**
     * 根据ID查询支付记录
     */
    PayRecordDO selectById(@Param("id") Long id);

    /**
     * 根据订单ID查询支付记录列表
     */
    List<PayRecordDO> selectByOrderId(@Param("orderId") Long orderId);

    /**
     * 根据支付流水号查询支付记录
     */
    PayRecordDO selectByPayNo(@Param("payNo") String payNo);

    /**
     * 插入支付记录
     */
    int insert(PayRecordDO payRecord);

    /**
     * 更新支付记录状态
     */
    int updatePayStatus(@Param("id") Long id,
                        @Param("payStatus") Integer payStatus,
                        @Param("thirdPayNo") String thirdPayNo);
}
