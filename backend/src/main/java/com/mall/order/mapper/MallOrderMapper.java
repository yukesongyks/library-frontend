package com.mall.order.mapper;

import com.mall.order.entity.MallOrderDO;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;

import java.util.List;

/**
 * 订单Mapper
 */
@Mapper
public interface MallOrderMapper {

    /**
     * 根据ID查询订单
     */
    MallOrderDO selectById(@Param("id") Long id);

    /**
     * 根据订单号查询订单
     */
    MallOrderDO selectByOrderNo(@Param("orderNo") String orderNo);

    /**
     * 根据用户ID查询订单列表
     */
    List<MallOrderDO> selectByUserId(@Param("userId") Long userId,
                                      @Param("offset") int offset,
                                      @Param("pageSize") int pageSize);

    /**
     * 插入订单
     */
    int insert(MallOrderDO order);

    /**
     * 更新订单状态
     */
    int updateOrderStatus(@Param("id") Long id,
                          @Param("orderStatus") Integer orderStatus);

    /**
     * 更新支付状态
     */
    int updatePayStatus(@Param("id") Long id,
                        @Param("payStatus") Integer payStatus,
                        @Param("payChannel") String payChannel);
}
