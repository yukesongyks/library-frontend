package com.mall.order.vo;

import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * 订单视图对象
 */
@Data
public class MallOrderVO {
    private Long id;
    private String orderNo;
    private Long userId;
    private BigDecimal totalAmount;
    private BigDecimal payAmount;
    private Integer orderStatus;
    private Integer payStatus;
    private String payChannel;
    private LocalDateTime payTime;
    private String remark;
    private LocalDateTime gmtCreate;
    private LocalDateTime gmtModified;
    private List<OrderItemVO> items;
}
