package com.mall.pay.entity;

import lombok.Data;

import java.time.LocalDateTime;

/**
 * 支付账号配置表
 */
@Data
public class PayAccountDO {
    /**
     * 系统自增主键
     */
    private Long id;

    /**
     * 支付渠道
     */
    private String channel;

    /**
     * 应用ID（环境变量注入）
     */
    private String appId;

    /**
     * 商户ID（环境变量注入）
     */
    private String merchantId;

    /**
     * 私钥（环境变量注入）
     */
    private String privateKey;

    /**
     * 公钥（环境变量注入）
     */
    private String publicKey;

    /**
     * API密钥（环境变量注入）
     */
    private String apiKey;

    /**
     * 是否沙箱环境
     */
    private Integer sandbox;

    /**
     * 创建时间
     */
    private LocalDateTime gmtCreate;
}
