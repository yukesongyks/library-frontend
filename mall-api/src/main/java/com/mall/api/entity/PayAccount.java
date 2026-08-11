package com.mall.api.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("pay_account")
public class PayAccount {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String channel;
    private String appId;
    private String merchantId;
    private String privateKey;
    private String publicKey;
    private String apiKey;
    private Integer sandbox;
    private LocalDateTime gmtCreate;
}
