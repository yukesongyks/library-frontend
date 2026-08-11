package com.mall.api.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@TableName("product")
public class Product {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String productName;
    private String productDesc;
    private Long categoryId;
    private Integer productStatus;
    private String productImage;
    private LocalDateTime gmtCreate;
    private LocalDateTime gmtModified;
}
