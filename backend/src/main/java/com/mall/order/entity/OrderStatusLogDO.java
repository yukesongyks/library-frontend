package com.mall.order.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 订单状态变更日志表
 */
@Data
public class OrderStatusLogDO {
    /**
     * 系统自增主键
     */
    private Long id;

    /**
     * 订单ID
     */
    private Long orderId;

    /**
     * 原状态
     */
    private Integer fromStatus;

    /**
     * 目标状态
     */
    private Integer toStatus;

    /**
     * 操作人/系统
     */
    private String operator;

    /**
     * 备注
     */
    private String remark;

    /**
     * 创建时间
     */
    private LocalDateTime gmtCreate;
}
