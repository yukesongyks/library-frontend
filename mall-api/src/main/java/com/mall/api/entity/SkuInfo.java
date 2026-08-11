package com.mall.api.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@TableName("sku_info")
public class SkuInfo {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long productId;
    private String skuName;
    private BigDecimal skuPrice;
    private Integer skuStock;
    private String skuImage;
    private LocalDateTime gmtCreate;
    private LocalDateTime gmtModified;
}
