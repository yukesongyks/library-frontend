-- 购物商城系统数据库初始化脚本
-- 创建时间: 2026-08-11
-- 数据库: mall

-- =================== 商品模块 ===================
-- 商品主表
CREATE TABLE IF NOT EXISTS product (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '系统自增主键',
    product_name VARCHAR(100) NOT NULL COMMENT '商品名称',
    product_desc VARCHAR(500) COMMENT '商品描述',
    category_id BIGINT NOT NULL COMMENT '分类ID',
    product_status TINYINT NOT NULL DEFAULT 1 COMMENT '商品状态：1-上架 2-下架',
    product_image VARCHAR(255) COMMENT '商品主图URL',
    gmt_create DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    gmt_modified DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
    UNIQUE KEY product_U (product_name),
    KEY idx_product_category_id (category_id),
    KEY idx_product_status (product_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品主表';

-- 商品SKU表
CREATE TABLE IF NOT EXISTS sku_info (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '系统自增主键',
    product_id BIGINT NOT NULL COMMENT '商品ID',
    sku_name VARCHAR(100) NOT NULL COMMENT 'SKU名称（如：红色-XXL）',
    sku_price DECIMAL(10,2) NOT NULL COMMENT 'SKU售价',
    sku_stock INT NOT NULL DEFAULT 0 COMMENT '库存数量',
    sku_image VARCHAR(255) COMMENT 'SKU图片URL',
    gmt_create DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    gmt_modified DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
    UNIQUE KEY sku_info_U (product_id, sku_name),
    KEY idx_sku_info_product_id (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='商品SKU表';

-- =================== 购物车模块 ===================
-- 购物车表
CREATE TABLE IF NOT EXISTS cart_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '系统自增主键',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    sku_id BIGINT NOT NULL COMMENT 'SKU ID',
    quantity INT NOT NULL DEFAULT 1 COMMENT '商品数量',
    gmt_create DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    gmt_modified DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
    UNIQUE KEY cart_item_U (user_id, sku_id),
    KEY idx_cart_item_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='购物车表';

-- =================== 订单模块 ===================
-- 订单主表
CREATE TABLE IF NOT EXISTS mall_order (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '系统自增主键',
    order_no VARCHAR(32) NOT NULL COMMENT '订单编号（唯一）',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    total_amount DECIMAL(10,2) NOT NULL COMMENT '订单总金额',
    pay_amount DECIMAL(10,2) NOT NULL DEFAULT 0.00 COMMENT '实际支付金额',
    order_status TINYINT NOT NULL DEFAULT 0 COMMENT '订单状态：0-待支付 1-已支付 2-处理中 3-已发货 4-已完成 5-已取消 6-退款中 7-已退款',
    pay_status TINYINT NOT NULL DEFAULT 0 COMMENT '支付状态：0-未支付 1-已支付 2-部分退款 3-全额退款',
    pay_channel VARCHAR(20) COMMENT '支付渠道：alipay/wechat',
    pay_time DATETIME COMMENT '支付时间',
    remark VARCHAR(255) COMMENT '备注',
    gmt_create DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    gmt_modified DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
    UNIQUE KEY mall_order_U (order_no),
    KEY idx_mall_order_user_id (user_id),
    KEY idx_mall_order_status (order_status),
    KEY idx_mall_order_gmt_create (gmt_create)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单主表';

-- 订单商品项表
CREATE TABLE IF NOT EXISTS order_item (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '系统自增主键',
    order_id BIGINT NOT NULL COMMENT '订单ID',
    sku_id BIGINT NOT NULL COMMENT 'SKU ID',
    sku_name VARCHAR(100) NOT NULL COMMENT 'SKU名称',
    sku_price DECIMAL(10,2) NOT NULL COMMENT '单价',
    quantity INT NOT NULL COMMENT '数量',
    subtotal DECIMAL(10,2) NOT NULL COMMENT '小计金额',
    gmt_create DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    KEY idx_order_item_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单商品项表';

-- 订单状态变更日志表
CREATE TABLE IF NOT EXISTS order_status_log (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '系统自增主键',
    order_id BIGINT NOT NULL COMMENT '订单ID',
    from_status TINYINT NOT NULL COMMENT '原状态',
    to_status TINYINT NOT NULL COMMENT '目标状态',
    operator VARCHAR(50) COMMENT '操作人/系统',
    remark VARCHAR(255) COMMENT '备注',
    gmt_create DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    KEY idx_order_status_log_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='订单状态变更日志表';

-- =================== 支付模块 ===================
-- 支付记录表
CREATE TABLE IF NOT EXISTS pay_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '系统自增主键',
    order_id BIGINT NOT NULL COMMENT '订单ID',
    pay_no VARCHAR(64) NOT NULL COMMENT '支付流水号',
    channel VARCHAR(20) NOT NULL COMMENT '支付渠道：alipay/wechat',
    pay_amount DECIMAL(10,2) NOT NULL COMMENT '支付金额',
    pay_status TINYINT NOT NULL DEFAULT 0 COMMENT '支付状态：0-待支付 1-支付中 2-支付成功 3-支付失败',
    third_pay_no VARCHAR(64) COMMENT '第三方支付流水号',
    third_resp TEXT COMMENT '第三方响应内容',
    gmt_create DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    gmt_modified DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
    UNIQUE KEY pay_record_U (pay_no),
    KEY idx_pay_record_order_id (order_id),
    KEY idx_pay_record_third_pay_no (third_pay_no)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付记录表';

-- 退款记录表
CREATE TABLE IF NOT EXISTS refund_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '系统自增主键',
    order_id BIGINT NOT NULL COMMENT '订单ID',
    pay_record_id BIGINT NOT NULL COMMENT '支付记录ID',
    refund_no VARCHAR(64) NOT NULL COMMENT '退款流水号',
    refund_amount DECIMAL(10,2) NOT NULL COMMENT '退款金额',
    refund_status TINYINT NOT NULL DEFAULT 0 COMMENT '退款状态：0-待处理 1-退款中 2-退款成功 3-退款失败',
    reason VARCHAR(255) COMMENT '退款原因',
    third_refund_no VARCHAR(64) COMMENT '第三方退款流水号',
    gmt_create DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    gmt_modified DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
    UNIQUE KEY refund_record_U (refund_no),
    KEY idx_refund_record_order_id (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='退款记录表';

-- 支付账号配置表
CREATE TABLE IF NOT EXISTS pay_account (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '系统自增主键',
    channel VARCHAR(20) NOT NULL COMMENT '支付渠道',
    app_id VARCHAR(64) NOT NULL COMMENT '应用ID（环境变量注入）',
    merchant_id VARCHAR(64) COMMENT '商户ID（环境变量注入）',
    private_key VARCHAR(2048) COMMENT '私钥（环境变量注入）',
    public_key VARCHAR(2048) COMMENT '公钥（环境变量注入）',
    api_key VARCHAR(255) COMMENT 'API密钥（环境变量注入）',
    sandbox TINYINT NOT NULL DEFAULT 0 COMMENT '是否沙箱环境',
    gmt_create DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY pay_account_U (channel)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='支付账号配置表';

-- =================== 秒杀模块 ===================
-- 秒杀活动表
CREATE TABLE IF NOT EXISTS seckill_activity (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '系统自增主键',
    activity_name VARCHAR(100) NOT NULL COMMENT '活动名称',
    sku_id BIGINT NOT NULL COMMENT 'SKU ID',
    seckill_price DECIMAL(10,2) NOT NULL COMMENT '秒杀价',
    stock_quantity INT NOT NULL COMMENT '秒杀库存',
    sold_quantity INT NOT NULL DEFAULT 0 COMMENT '已售数量',
    start_time DATETIME NOT NULL COMMENT '开始时间',
    end_time DATETIME NOT NULL COMMENT '结束时间',
    activity_status TINYINT NOT NULL DEFAULT 0 COMMENT '活动状态：0-未开始 1-进行中 2-已结束',
    gmt_create DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    gmt_modified DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
    KEY idx_seckill_activity_sku_id (sku_id),
    KEY idx_seckill_activity_status (activity_status),
    KEY idx_seckill_activity_time (start_time, end_time)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='秒杀活动表';

-- 秒杀订单表
CREATE TABLE IF NOT EXISTS seckill_order (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '系统自增主键',
    activity_id BIGINT NOT NULL COMMENT '活动ID',
    order_id BIGINT NOT NULL COMMENT '订单ID',
    user_id BIGINT NOT NULL COMMENT '用户ID',
    gmt_create DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    UNIQUE KEY seckill_order_U (activity_id, user_id),
    KEY idx_seckill_order_user_id (user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='秒杀订单表';

-- =================== 消息队列模块 ===================
-- 消息发送记录表
CREATE TABLE IF NOT EXISTS mq_message_record (
    id BIGINT AUTO_INCREMENT PRIMARY KEY COMMENT '系统自增主键',
    topic VARCHAR(64) NOT NULL COMMENT 'Topic名称',
    tag VARCHAR(64) COMMENT 'Tag',
    message_key VARCHAR(128) COMMENT '消息Key',
    message_body TEXT NOT NULL COMMENT '消息内容',
    message_status TINYINT NOT NULL DEFAULT 0 COMMENT '消息状态：0-待发送 1-已发送 2-发送失败 3-已消费 4-消费失败',
    retry_count INT NOT NULL DEFAULT 0 COMMENT '重试次数',
    gmt_create DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '创建时间',
    gmt_modified DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT '修改时间',
    KEY idx_mq_message_topic_key (topic, message_key),
    KEY idx_mq_message_status (message_status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='消息发送记录表';
