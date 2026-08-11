package com.mall.dao.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.mall.api.entity.MallOrder;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Update;

@Mapper
public interface MallOrderMapper extends BaseMapper<MallOrder> {

    @Update("UPDATE mall_order SET order_status = #{orderStatus}, pay_status = #{payStatus} WHERE id = #{id}")
    int updateStatus(@Param("id") Long id, @Param("orderStatus") Integer orderStatus, @Param("payStatus") Integer payStatus);
}
