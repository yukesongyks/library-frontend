package com.mall.pay.mapper;

import com.mall.pay.entity.RefundRecordDO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 退款记录Mapper
 */
@Mapper
public interface RefundRecordMapper {

    /**
     * 根据ID查询退款记录
     */
    RefundRecordDO selectById(@Param("id") Long id);

    /**
     * 根据订单ID查询退款记录列表
     */
    List<RefundRecordDO> selectByOrderId(@Param("orderId") Long orderId);

    /**
     * 插入退款记录
     */
    int insert(RefundRecordDO refundRecord);

    /**
     * 更新退款记录状态
     */
    int updateRefundStatus(@Param("id") Long id,
                           @Param("refundStatus") Integer refundStatus,
                           @Param("thirdRefundNo") String thirdRefundNo);
}
