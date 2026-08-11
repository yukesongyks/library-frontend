package com.mall.api.request;

import lombok.Data;

@Data
public class PayCreateRequest {
    private Long orderId;
    private String channel;
}
