package com.mall.api.request;

import lombok.Data;

import java.util.List;

@Data
public class OrderCreateRequest {
    private List<Long> cartItemIds;
    private Long addressId;
    private String remark;
}
