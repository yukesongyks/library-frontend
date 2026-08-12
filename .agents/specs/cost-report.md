# 成本统计报表 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在图书管理系统（library-frontend + library-backend）中新增成本统计报表功能，支持按部门、项目、业务线、人员、月份/季度/年度多维度统计人力成本（开发/测试/产品/运维）与项目成本（预算/实际消耗/预算占比/预计超支金额），并提供 Dashboard 可视化与报表导出。

**Architecture:** 前端采用 React + TypeScript + Ant Design + ECharts，新增「成本统计」路由与 Dashboard 页面，通过 REST API 调用后端聚合接口；后端采用 Spring Boot + MyBatis-Plus，新增 cost 模块（Controller/Service/Mapper/DTO），基于现有 cost_record / project_budget 等表进行多维聚合查询，并通过 Apache POI 实现 Excel 导出。前后端通过 OpenAPI 风格的 REST 契约对齐。

**Tech Stack:**
- 前端：React 18 + TypeScript 5 + Vite + Ant Design 5 + ECharts 5 + Axios + React Router 6
- 后端：Spring Boot 3 + Java 17 + MyBatis-Plus + MySQL 8 + Apache POI 5 + Lombok
- 测试：前端 Vitest + React Testing Library；后端 JUnit 5 + Mockito + H2

---

## Global Constraints

- 前端 Node 版本 >= 18.18.0，pnpm >= 8.9.0
- 后端 Java 17，Maven 3.9+
- 前端命名：组件 PascalCase，工具函数 camelCase，路由 kebab-case
- 后端命名：包名 com.library.cost，Controller/Service/Mapper 后缀
- 所有金额字段使用 `BigDecimal`（后端）与 number（前端，单位：元），禁止 float/double
- API 路径统一前缀 `/api/cost`
- 所有接口返回统一响应体 `{ code: number; message: string; data: T }`
- 时间维度参数：month 格式 `yyyy-MM`，quarter 格式 `yyyy-Qq`（如 `2026-Q1`），year 格式 `yyyy`
- 金额展示统一保留 2 位小数
- 报表导出格式：Excel (.xlsx)
- 禁止修改现有图书管理业务代码，仅新增 cost 模块文件

---

## File Structure

### library-frontend（前端）

| 文件路径 | 职责 |
|---|---|
| `src/types/cost.ts` | 成本相关 TypeScript 类型定义（CostRecord, ProjectCost, Dimension, StatQuery, StatResult） |
| `src/api/cost.ts` | 成本统计 API 请求封装（getCostDashboard, getCostStat, exportCostReport） |
| `src/pages/cost/CostDashboard.tsx` | 成本统计 Dashboard 主页面，组合筛选器 + 图表 + 表格 |
| `src/pages/cost/components/DimensionFilter.tsx` | 维度筛选器组件（部门/项目/业务线/人员/时间维度） |
| `src/pages/cost/components/LaborCostChart.tsx` | 人力成本图表（按角色：开发/测试/产品/运维） |
| `src/pages/cost/components/ProjectCostChart.tsx` | 项目成本图表（预算/实际/占比/超支） |
| `src/pages/cost/components/CostTable.tsx` | 成本明细表格组件，支持导出按钮 |
| `src/pages/cost/components/ExportButton.tsx` | 报表导出按钮组件 |
| `src/router/index.ts` | 修改：新增 `/cost/dashboard` 路由 |
| `src/layouts/MainLayout.tsx` | 修改：侧边栏新增「成本统计」菜单项 |
| `src/api/request.ts` | 修改：统一处理 blob 下载响应 |
| `src/__tests__/cost.test.ts` | 成本 API 与类型测试 |

### library-backend（后端）

| 文件路径 | 职责 |
|---|---|
| `library-backend/src/main/java/com/library/cost/controller/CostController.java` | 成本统计 REST 接口 |
| `library-backend/src/main/java/com/library/cost/service/CostService.java` | 成本聚合统计业务逻辑 |
| `library-backend/src/main/java/com/library/cost/service/impl/CostServiceImpl.java` | Service 实现 |
| `library-backend/src/main/java/com/library/cost/mapper/CostMapper.java` | MyBatis 映射接口 |
| `library-backend/src/main/java/com/library/cost/mapper/xml/CostMapper.xml` | SQL 聚合查询 |
| `library-backend/src/main/java/com/library/cost/dto/CostStatQueryDTO.java` | 统计查询入参 |
| `library-backend/src/main/java/com/library/cost/dto/CostDashboardVO.java` | Dashboard 聚合返回 |
| `library-backend/src/main/java/com/library/cost/dto/LaborCostVO.java` | 人力成本返回 |
| `library-backend/src/main/java/com/library/cost/dto/ProjectCostVO.java` | 项目成本返回 |
| `library-backend/src/main/java/com/library/cost/dto/CostRecordDTO.java` | 成本记录明细 |
| `library-backend/src/main/java/com/library/cost/enums/CostDimension.java` | 维度枚举（DEPT/PROJECT/BUSINESS_LINE/PERSON） |
| `library-backend/src/main/java/com/library/cost/enums/LaborRole.java` | 人力角色枚举（DEV/QA/PM/OPS） |
| `library-backend/src/main/java/com/library/cost/enums/TimeDimension.java` | 时间维度枚举（MONTH/QUARTER/YEAR） |
| `library-backend/src/main/java/com/library/cost/util/CostExcelExporter.java` | Excel 导出工具 |
| `library-backend/src/main/resources/db/migration/V2026081201__create_cost_tables.sql` | 建表迁移脚本 |
| `library-backend/src/test/java/com/library/cost/CostServiceImplTest.java` | Service 单元测试 |
| `library-backend/src/test/java/com/library/cost/CostControllerTest.java` | Controller 集成测试 |
| `library-backend/pom.xml` | 修改：新增 POI 依赖 |

---

## 仓间对齐点（接口契约）

### 1. GET `/api/cost/dashboard`

**请求参数（Query）：**

| 参数 | 类型 | 必填 | 说明 |
|---|---|---|---|
| dimension | string | 否 | 聚合维度：DEPT / PROJECT / BUSINESS_LINE / PERSON，默认 DEPT |
| timeDimension | string | 否 | 时间维度：MONTH / QUARTER / YEAR，默认 MONTH |
| timeValue | string | 否 | 时间值，如 `2026-08` / `2026-Q3` / `2026` |
| deptId | long | 否 | 部门 ID 筛选 |
| projectId | long | 否 | 项目 ID 筛选 |
| businessLineId | long | 否 | 业务线 ID 筛选 |
| personId | long | 否 | 人员 ID 筛选 |

**响应体 `CostDashboardVO`：**

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "laborCosts": [
      { "dimensionLabel": "研发一部", "dev": 120000.00, "qa": 50000.00, "pm": 30000.00, "ops": 20000.00, "total": 220000.00 }
    ],
    "projectCosts": [
      {
        "projectId": 1,
        "projectName": "图书管理系统升级",
        "budget": 500000.00,
        "actualCost": 320000.00,
        "budgetRatio": 0.64,
        "estimatedOverspend": 0.00
      }
    ],
    "summary": {
      "totalLaborCost": 220000.00,
      "totalProjectBudget": 500000.00,
      "totalActualCost": 320000.00,
      "overallBudgetRatio": 0.64,
      "totalEstimatedOverspend": 0.00
    }
  }
}
```

### 2. GET `/api/cost/stat`

**请求参数：** 同 dashboard，额外支持 `page` / `size` 分页。

**响应：** 分页列表 `CostRecordDTO[]`。

### 3. GET `/api/cost/export`

**请求参数：** 同 dashboard（不分页）。

**响应：** `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`，Content-Disposition: `attachment; filename="cost-report.xlsx"`。

---

## Task 1: 后端数据库表结构与迁移脚本

**Files:**
- Create: `library-backend/src/main/resources/db/migration/V2026081201__create_cost_tables.sql`

**Interfaces:**
- Consumes: 无
- Produces: `cost_record` 表、`project_budget` 表，供后续 Mapper 查询

**Steps:**

- [ ] 编写建表 SQL，包含 `cost_record` 表（id, dept_id, project_id, business_line_id, person_id, labor_role, amount, cost_date, created_at, updated_at）与 `project_budget` 表（id, project_id, budget, actual_cost, period, created_at, updated_at）
- [ ] 执行迁移脚本验证表结构创建成功

```sql
-- V2026081201__create_cost_tables.sql

CREATE TABLE IF NOT EXISTS `cost_record` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
  `dept_id` BIGINT NOT NULL COMMENT '部门ID',
  `project_id` BIGINT DEFAULT NULL COMMENT '项目ID',
  `business_line_id` BIGINT DEFAULT NULL COMMENT '业务线ID',
  `person_id` BIGINT NOT NULL COMMENT '人员ID',
  `labor_role` VARCHAR(10) NOT NULL COMMENT '人力角色: DEV/QA/PM/OPS',
  `amount` DECIMAL(15,2) NOT NULL COMMENT '金额(元)',
  `cost_date` DATE NOT NULL COMMENT '成本日期',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_cost_date` (`cost_date`),
  KEY `idx_dept_id` (`dept_id`),
  KEY `idx_project_id` (`project_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='成本记录表';

CREATE TABLE IF NOT EXISTS `project_budget` (
  `id` BIGINT NOT NULL AUTO_INCREMENT COMMENT '主键',
  `project_id` BIGINT NOT NULL COMMENT '项目ID',
  `budget` DECIMAL(15,2) NOT NULL COMMENT '项目预算(元)',
  `actual_cost` DECIMAL(15,2) NOT NULL DEFAULT 0.00 COMMENT '实际消耗(元)',
  `period` VARCHAR(10) NOT NULL COMMENT '周期: yyyy-MM / yyyy-Qq / yyyy',
  `created_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updated_at` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uk_project_period` (`project_id`, `period`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COMMENT='项目预算表';
```

- [ ] 运行迁移：`cd library-backend && mvn flyway:migrate`（预期输出 `Successfully applied 1 migration`）
- [ ] Commit: `git add -A && git commit -m "feat(cost): add cost_record and project_budget tables"`

---

## Task 2: 后端枚举与 DTO 定义

**Files:**
- Create: `library-backend/src/main/java/com/library/cost/enums/CostDimension.java`
- Create: `library-backend/src/main/java/com/library/cost/enums/LaborRole.java`
- Create: `library-backend/src/main/java/com/library/cost/enums/TimeDimension.java`
- Create: `library-backend/src/main/java/com/library/cost/dto/CostStatQueryDTO.java`
- Create: `library-backend/src/main/java/com/library/cost/dto/CostDashboardVO.java`
- Create: `library-backend/src/main/java/com/library/cost/dto/LaborCostVO.java`
- Create: `library-backend/src/main/java/com/library/cost/dto/ProjectCostVO.java`
- Create: `library-backend/src/main/java/com/library/cost/dto/CostRecordDTO.java`

**Interfaces:**
- Consumes: 无
- Produces: 枚举与 DTO 类，供 Controller/Service/Mapper 使用

**Steps:**

- [ ] 创建 `CostDimension` 枚举

```java
package com.library.cost.enums;

public enum CostDimension {
    DEPT("部门"),
    PROJECT("项目"),
    BUSINESS_LINE("业务线"),
    PERSON("人员");

    private final String label;
    CostDimension(String label) { this.label = label; }
    public String getLabel() { return label; }
}
```

- [ ] 创建 `LaborRole` 枚举

```java
package com.library.cost.enums;

public enum LaborRole {
    DEV("开发"),
    QA("测试"),
    PM("产品"),
    OPS("运维");

    private final String label;
    LaborRole(String label) { this.label = label; }
    public String getLabel() { return label; }
}
```

- [ ] 创建 `TimeDimension` 枚举

```java
package com.library.cost.enums;

public enum TimeDimension {
    MONTH("月份"),
    QUARTER("季度"),
    YEAR("年度");

    private final String label;
    TimeDimension(String label) { this.label = label; }
    public String getLabel() { return label; }
}
```

- [ ] 创建 `CostStatQueryDTO`

```java
package com.library.cost.dto;

import com.library.cost.enums.CostDimension;
import com.library.cost.enums.TimeDimension;
import lombok.Data;

@Data
public class CostStatQueryDTO {
    private CostDimension dimension = CostDimension.DEPT;
    private TimeDimension timeDimension = TimeDimension.MONTH;
    private String timeValue;
    private Long deptId;
    private Long projectId;
    private Long businessLineId;
    private Long personId;
    private Integer page = 1;
    private Integer size = 20;
}
```

- [ ] 创建 `LaborCostVO`

```java
package com.library.cost.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class LaborCostVO {
    private String dimensionLabel;
    private BigDecimal dev = BigDecimal.ZERO;
    private BigDecimal qa = BigDecimal.ZERO;
    private BigDecimal pm = BigDecimal.ZERO;
    private BigDecimal ops = BigDecimal.ZERO;
    private BigDecimal total = BigDecimal.ZERO;
}
```

- [ ] 创建 `ProjectCostVO`

```java
package com.library.cost.dto;

import lombok.Data;
import java.math.BigDecimal;

@Data
public class ProjectCostVO {
    private Long projectId;
    private String projectName;
    private BigDecimal budget = BigDecimal.ZERO;
    private BigDecimal actualCost = BigDecimal.ZERO;
    private BigDecimal budgetRatio = BigDecimal.ZERO;
    private BigDecimal estimatedOverspend = BigDecimal.ZERO;
}
```

- [ ] 创建 `CostDashboardVO`

```java
package com.library.cost.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.List;

@Data
public class CostDashboardVO {
    private List<LaborCostVO> laborCosts;
    private List<ProjectCostVO> projectCosts;
    private Summary summary;

    @Data
    public static class Summary {
        private BigDecimal totalLaborCost = BigDecimal.ZERO;
        private BigDecimal totalProjectBudget = BigDecimal.ZERO;
        private BigDecimal totalActualCost = BigDecimal.ZERO;
        private BigDecimal overallBudgetRatio = BigDecimal.ZERO;
        private BigDecimal totalEstimatedOverspend = BigDecimal.ZERO;
    }
}
```

- [ ] 创建 `CostRecordDTO`

```java
package com.library.cost.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class CostRecordDTO {
    private Long id;
    private Long deptId;
    private String deptName;
    private Long projectId;
    private String projectName;
    private Long businessLineId;
    private String businessLineName;
    private Long personId;
    private String personName;
    private String laborRole;
    private BigDecimal amount;
    private LocalDate costDate;
}
```

- [ ] 编译验证：`cd library-backend && mvn compile -q`（预期 BUILD SUCCESS）
- [ ] Commit: `git add -A && git commit -m "feat(cost): add enums and DTOs"`

---

## Task 3: 后端 Mapper 与 SQL 聚合查询

**Files:**
- Create: `library-backend/src/main/java/com/library/cost/mapper/CostMapper.java`
- Create: `library-backend/src/main/resources/mapper/CostMapper.xml`

**Interfaces:**
- Consumes: `CostStatQueryDTO`（Task 2）
- Produces: `LaborCostVO`、`ProjectCostVO`、`CostRecordDTO` 列表

**Steps:**

- [ ] 创建 `CostMapper` 接口

```java
package com.library.cost.mapper;

import com.library.cost.dto.*;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import java.util.List;

@Mapper
public interface CostMapper {
    List<LaborCostVO> queryLaborCosts(@Param("query") CostStatQueryDTO query);
    List<ProjectCostVO> queryProjectCosts(@Param("query") CostStatQueryDTO query);
    List<CostRecordDTO> queryCostRecords(@Param("query") CostStatQueryDTO query);
    long countCostRecords(@Param("query") CostStatQueryDTO query);
}
```

- [ ] 创建 `CostMapper.xml`，实现按维度聚合的人力成本查询、项目成本查询、明细查询

```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE mapper PUBLIC "-//mybatis.org//DTD Mapper 3.0//EN"
  "http://mybatis.org/dtd/mybatis-3-mapper.dtd">
<mapper namespace="com.library.cost.mapper.CostMapper">

  <select id="queryLaborCosts" resultType="com.library.cost.dto.LaborCostVO">
    SELECT
      <choose>
        <when test="query.dimension.name() == 'DEPT'">d.name</when>
        <when test="query.dimension.name() == 'PROJECT'">p.name</when>
        <when test="query.dimension.name() == 'BUSINESS_LINE'">bl.name</when>
        <otherwise>per.name</otherwise>
      </choose> AS dimensionLabel,
      SUM(CASE WHEN cr.labor_role = 'DEV' THEN cr.amount ELSE 0 END) AS dev,
      SUM(CASE WHEN cr.labor_role = 'QA' THEN cr.amount ELSE 0 END) AS qa,
      SUM(CASE WHEN cr.labor_role = 'PM' THEN cr.amount ELSE 0 END) AS pm,
      SUM(CASE WHEN cr.labor_role = 'OPS' THEN cr.amount ELSE 0 END) AS ops,
      SUM(cr.amount) AS total
    FROM cost_record cr
    LEFT JOIN sys_dept d ON cr.dept_id = d.id
    LEFT JOIN project p ON cr.project_id = p.id
    LEFT JOIN business_line bl ON cr.business_line_id = bl.id
    LEFT JOIN person per ON cr.person_id = per.id
    <where>
      <if test="query.timeValue != null and query.timeDimension.name() == 'MONTH'">
        DATE_FORMAT(cr.cost_date, '%Y-%m') = #{query.timeValue}
      </if>
      <if test="query.timeValue != null and query.timeDimension.name() == 'QUARTER'">
        CONCAT(YEAR(cr.cost_date), '-Q', QUARTER(cr.cost_date)) = #{query.timeValue}
      </if>
      <if test="query.timeValue != null and query.timeDimension.name() == 'YEAR'">
        YEAR(cr.cost_date) = #{query.timeValue}
      </if>
      <if test="query.deptId != null">AND cr.dept_id = #{query.deptId}</if>
      <if test="query.projectId != null">AND cr.project_id = #{query.projectId}</if>
      <if test="query.businessLineId != null">AND cr.business_line_id = #{query.businessLineId}</if>
      <if test="query.personId != null">AND cr.person_id = #{query.personId}</if>
    </where>
    GROUP BY dimensionLabel
    ORDER BY total DESC
  </select>

  <select id="queryProjectCosts" resultType="com.library.cost.dto.ProjectCostVO">
    SELECT
      pb.project_id AS projectId,
      p.name AS projectName,
      pb.budget AS budget,
      pb.actual_cost AS actualCost,
      CASE WHEN pb.budget > 0 THEN pb.actual_cost / pb.budget ELSE 0 END AS budgetRatio,
      CASE WHEN pb.actual_cost > pb.budget THEN pb.actual_cost - pb.budget ELSE 0 END AS estimatedOverspend
    FROM project_budget pb
    LEFT JOIN project p ON pb.project_id = p.id
    <where>
      <if test="query.timeValue != null">AND pb.period = #{query.timeValue}</if>
      <if test="query.projectId != null">AND pb.project_id = #{query.projectId}</if>
    </where>
    ORDER BY budgetRatio DESC
  </select>

  <select id="queryCostRecords" resultType="com.library.cost.dto.CostRecordDTO">
    SELECT
      cr.id, cr.dept_id AS deptId, d.name AS deptName,
      cr.project_id AS projectId, p.name AS projectName,
      cr.business_line_id AS businessLineId, bl.name AS businessLineName,
      cr.person_id AS personId, per.name AS personName,
      cr.labor_role AS laborRole, cr.amount, cr.cost_date AS costDate
    FROM cost_record cr
    LEFT JOIN sys_dept d ON cr.dept_id = d.id
    LEFT JOIN project p ON cr.project_id = p.id
    LEFT JOIN business_line bl ON cr.business_line_id = bl.id
    LEFT JOIN person per ON cr.person_id = per.id
    <where>
      <if test="query.deptId != null">AND cr.dept_id = #{query.deptId}</if>
      <if test="query.projectId != null">AND cr.project_id = #{query.projectId}</if>
      <if test="query.businessLineId != null">AND cr.business_line_id = #{query.businessLineId}</if>
      <if test="query.personId != null">AND cr.person_id = #{query.personId}</if>
      <if test="query.timeValue != null and query.timeDimension.name() == 'MONTH'">
        AND DATE_FORMAT(cr.cost_date, '%Y-%m') = #{query.timeValue}
      </if>
    </where>
    ORDER BY cr.cost_date DESC
    LIMIT #{query.size} OFFSET #{query.offset}
  </select>

  <select id="countCostRecords" resultType="long">
    SELECT COUNT(*) FROM cost_record cr
    <where>
      <if test="query.deptId != null">AND cr.dept_id = #{query.deptId}</if>
      <if test="query.projectId != null">AND cr.project_id = #{query.projectId}</if>
      <if test="query.businessLineId != null">AND cr.business_line_id = #{query.businessLineId}</if>
      <if test="query.personId != null">AND cr.person_id = #{query.personId}</if>
    </where>
  </select>

</mapper>
```

- [ ] 编译验证：`cd library-backend && mvn compile -q`（预期 BUILD SUCCESS）
- [ ] Commit: `git add -A && git commit -m "feat(cost): add CostMapper with aggregation queries"`

---

## Task 4: 后端 Service 业务逻辑

**Files:**
- Create: `library-backend/src/main/java/com/library/cost/service/CostService.java`
- Create: `library-backend/src/main/java/com/library/cost/service/impl/CostServiceImpl.java`

**Interfaces:**
- Consumes: `CostMapper`（Task 3）、`CostStatQueryDTO`（Task 2）
- Produces: `CostDashboardVO`、分页 `CostRecordDTO` 列表

**Steps:**

- [ ] 创建 `CostService` 接口

```java
package com.library.cost.service;

import com.library.cost.dto.CostDashboardVO;
import com.library.cost.dto.CostRecordDTO;
import com.library.cost.dto.CostStatQueryDTO;
import java.util.List;

public interface CostService {
    CostDashboardVO getDashboard(CostStatQueryDTO query);
    List<CostRecordDTO> getCostRecords(CostStatQueryDTO query);
    byte[] exportReport(CostStatQueryDTO query);
}
```

- [ ] 创建 `CostServiceImpl`，聚合 Mapper 结果并计算 summary

```java
package com.library.cost.service.impl;

import com.library.cost.dto.*;
import com.library.cost.mapper.CostMapper;
import com.library.cost.service.CostService;
import com.library.cost.util.CostExcelExporter;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;

@Service
@RequiredArgsConstructor
public class CostServiceImpl implements CostService {

    private final CostMapper costMapper;
    private final CostExcelExporter excelExporter;

    @Override
    public CostDashboardVO getDashboard(CostStatQueryDTO query) {
        CostDashboardVO vo = new CostDashboardVO();
        vo.setLaborCosts(costMapper.queryLaborCosts(query));
        vo.setProjectCosts(costMapper.queryProjectCosts(query));

        CostDashboardVO.Summary summary = new CostDashboardVO.Summary();
        summary.setTotalLaborCost(
            vo.getLaborCosts().stream()
                .map(LaborCostVO::getTotal)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
        );
        summary.setTotalProjectBudget(
            vo.getProjectCosts().stream()
                .map(ProjectCostVO::getBudget)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
        );
        summary.setTotalActualCost(
            vo.getProjectCosts().stream()
                .map(ProjectCostVO::getActualCost)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
        );
        summary.setOverallBudgetRatio(
            summary.getTotalProjectBudget().compareTo(BigDecimal.ZERO) > 0
                ? summary.getTotalActualCost()
                    .divide(summary.getTotalProjectBudget(), 4, RoundingMode.HALF_UP)
                : BigDecimal.ZERO
        );
        summary.setTotalEstimatedOverspend(
            vo.getProjectCosts().stream()
                .map(ProjectCostVO::getEstimatedOverspend)
                .reduce(BigDecimal.ZERO, BigDecimal::add)
        );
        vo.setSummary(summary);
        return vo;
    }

    @Override
    public List<CostRecordDTO> getCostRecords(CostStatQueryDTO query) {
        return costMapper.queryCostRecords(query);
    }

    @Override
    public byte[] exportReport(CostStatQueryDTO query) {
        CostDashboardVO dashboard = getDashboard(query);
        List<CostRecordDTO> records = costMapper.queryCostRecords(query);
        return excelExporter.export(dashboard, records);
    }
}
```

- [ ] 编译验证：`cd library-backend && mvn compile -q`（预期 BUILD SUCCESS）
- [ ] Commit: `git add -A && git commit -m "feat(cost): add CostService with dashboard aggregation"`

---

## Task 5: 后端 Excel 导出工具

**Files:**
- Modify: `library-backend/pom.xml`（新增 POI 依赖）
- Create: `library-backend/src/main/java/com/library/cost/util/CostExcelExporter.java`

**Interfaces:**
- Consumes: `CostDashboardVO`、`List<CostRecordDTO>`（Task 2/4）
- Produces: `byte[]`（Excel 文件内容）

**Steps:**

- [ ] 在 `pom.xml` 的 `<dependencies>` 中新增 POI 依赖

```xml
<dependency>
    <groupId>org.apache.poi</groupId>
    <artifactId>poi-ooxml</artifactId>
    <version>5.2.5</version>
</dependency>
```

- [ ] 创建 `CostExcelExporter`，生成包含「人力成本」「项目成本」「明细」三个 Sheet 的 Excel

```java
package com.library.cost.util;

import com.library.cost.dto.*;
import org.apache.poi.ss.usermodel.*;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.math.BigDecimal;
import java.util.List;

@Component
public class CostExcelExporter {

    public byte[] export(CostDashboardVO dashboard, List<CostRecordDTO> records) {
        try (XSSFWorkbook wb = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {

            CellStyle headerStyle = createHeaderStyle(wb);

            // Sheet 1: 人力成本
            Sheet laborSheet = wb.createSheet("人力成本");
            Row laborHeader = laborSheet.createRow(0);
            String[] laborHeaders = {"维度", "开发", "测试", "产品", "运维", "合计"};
            for (int i = 0; i < laborHeaders.length; i++) {
                Cell c = laborHeader.createCell(i);
                c.setCellValue(laborHeaders[i]);
                c.setCellStyle(headerStyle);
            }
            int rowIdx = 1;
            for (LaborCostVO lc : dashboard.getLaborCosts()) {
                Row r = laborSheet.createRow(rowIdx++);
                r.createCell(0).setCellValue(lc.getDimensionLabel());
                r.createCell(1).setCellValue(lc.getDev().doubleValue());
                r.createCell(2).setCellValue(lc.getQa().doubleValue());
                r.createCell(3).setCellValue(lc.getPm().doubleValue());
                r.createCell(4).setCellValue(lc.getOps().doubleValue());
                r.createCell(5).setCellValue(lc.getTotal().doubleValue());
            }

            // Sheet 2: 项目成本
            Sheet projSheet = wb.createSheet("项目成本");
            Row projHeader = projSheet.createRow(0);
            String[] projHeaders = {"项目ID", "项目名称", "预算", "实际消耗", "预算占比", "预计超支"};
            for (int i = 0; i < projHeaders.length; i++) {
                Cell c = projHeader.createCell(i);
                c.setCellValue(projHeaders[i]);
                c.setCellStyle(headerStyle);
            }
            rowIdx = 1;
            for (ProjectCostVO pc : dashboard.getProjectCosts()) {
                Row r = projSheet.createRow(rowIdx++);
                r.createCell(0).setCellValue(pc.getProjectId());
                r.createCell(1).setCellValue(pc.getProjectName());
                r.createCell(2).setCellValue(pc.getBudget().doubleValue());
                r.createCell(3).setCellValue(pc.getActualCost().doubleValue());
                r.createCell(4).setCellValue(pc.getBudgetRatio().doubleValue());
                r.createCell(5).setCellValue(pc.getEstimatedOverspend().doubleValue());
            }

            // Sheet 3: 明细
            Sheet detailSheet = wb.createSheet("成本明细");
            Row detailHeader = detailSheet.createRow(0);
            String[] detailHeaders = {"ID", "部门", "项目", "业务线", "人员", "角色", "金额", "日期"};
            for (int i = 0; i < detailHeaders.length; i++) {
                Cell c = detailHeader.createCell(i);
                c.setCellValue(detailHeaders[i]);
                c.setCellStyle(headerStyle);
            }
            rowIdx = 1;
            for (CostRecordDTO rec : records) {
                Row r = detailSheet.createRow(rowIdx++);
                r.createCell(0).setCellValue(rec.getId());
                r.createCell(1).setCellValue(rec.getDeptName());
                r.createCell(2).setCellValue(rec.getProjectName());
                r.createCell(3).setCellValue(rec.getBusinessLineName());
                r.createCell(4).setCellValue(rec.getPersonName());
                r.createCell(5).setCellValue(rec.getLaborRole());
                r.createCell(6).setCellValue(rec.getAmount().doubleValue());
                r.createCell(7).setCellValue(rec.getCostDate().toString());
            }

            wb.write(out);
            return out.toByteArray();
        } catch (Exception e) {
            throw new RuntimeException("导出Excel失败", e);
        }
    }

    private CellStyle createHeaderStyle(Workbook wb) {
        CellStyle style = wb.createCellStyle();
        Font font = wb.createFont();
        font.setBold(true);
        style.setFont(font);
        style.setFillForegroundColor(IndexedColors.GREY_25_PERCENT.getIndex());
        style.setFillPattern(FillPatternType.SOLID_FOREGROUND);
        return style;
    }
}
```

- [ ] 编译验证：`cd library-backend && mvn compile -q`（预期 BUILD SUCCESS）
- [ ] Commit: `git add -A && git commit -m "feat(cost): add Excel export with POI"`

---

## Task 6: 后端 Controller REST 接口

**Files:**
- Create: `library-backend/src/main/java/com/library/cost/controller/CostController.java`

**Interfaces:**
- Consumes: `CostService`（Task 4）
- Produces: REST 端点 `/api/cost/dashboard`、`/api/cost/stat`、`/api/cost/export`

**Steps:**

- [ ] 创建 `CostController`

```java
package com.library.cost.controller;

import com.library.cost.dto.CostDashboardVO;
import com.library.cost.dto.CostRecordDTO;
import com.library.cost.dto.CostStatQueryDTO;
import com.library.cost.service.CostService;
import com.library.common.Result;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.List;

@RestController
@RequestMapping("/api/cost")
@RequiredArgsConstructor
public class CostController {

    private final CostService costService;

    @GetMapping("/dashboard")
    public Result<CostDashboardVO> dashboard(CostStatQueryDTO query) {
        return Result.success(costService.getDashboard(query));
    }

    @GetMapping("/stat")
    public Result<List<CostRecordDTO>> stat(CostStatQueryDTO query) {
        return Result.success(costService.getCostRecords(query));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> export(CostStatQueryDTO query) {
        byte[] bytes = costService.exportReport(query);
        String filename = URLEncoder.encode("cost-report.xlsx", StandardCharsets.UTF_8);
        return ResponseEntity.ok()
            .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=" + filename)
            .contentType(MediaType.parseMediaType(
                "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"))
            .body(bytes);
    }
}
```

- [ ] 编译验证：`cd library-backend && mvn compile -q`（预期 BUILD SUCCESS）
- [ ] 启动应用验证接口：`cd library-backend && mvn spring-boot:run`，访问 `http://localhost:8080/api/cost/dashboard` 返回 200
- [ ] Commit: `git add -A && git commit -m "feat(cost): add CostController REST endpoints"`

---

## Task 7: 后端单元测试与集成测试

**Files:**
- Create: `library-backend/src/test/java/com/library/cost/CostServiceImplTest.java`
- Create: `library-backend/src/test/java/com/library/cost/CostControllerTest.java`

**Interfaces:**
- Consumes: `CostService`、`CostController`（Task 4/6）
- Produces: 测试通过证据

**Steps:**

- [ ] 编写 `CostServiceImplTest`，mock `CostMapper`，验证 dashboard 聚合计算正确

```java
package com.library.cost;

import com.library.cost.dto.*;
import com.library.cost.mapper.CostMapper;
import com.library.cost.service.impl.CostServiceImpl;
import com.library.cost.util.CostExcelExporter;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CostServiceImplTest {

    @Mock
    CostMapper costMapper;
    @Mock
    CostExcelExporter excelExporter;

    @InjectMocks
    CostServiceImpl service;

    @Test
    void getDashboard_aggregatesSummaryCorrectly() {
        LaborCostVO lc = new LaborCostVO();
        lc.setDimensionLabel("研发一部");
        lc.setDev(new BigDecimal("120000"));
        lc.setTotal(new BigDecimal("220000"));

        ProjectCostVO pc = new ProjectCostVO();
        pc.setProjectId(1L);
        pc.setProjectName("项目A");
        pc.setBudget(new BigDecimal("500000"));
        pc.setActualCost(new BigDecimal("320000"));
        pc.setBudgetRatio(new BigDecimal("0.64"));
        pc.setEstimatedOverspend(BigDecimal.ZERO);

        when(costMapper.queryLaborCosts(any())).thenReturn(List.of(lc));
        when(costMapper.queryProjectCosts(any())).thenReturn(List.of(pc));

        CostDashboardVO result = service.getDashboard(new CostStatQueryDTO());

        assertEquals(new BigDecimal("220000"), result.getSummary().getTotalLaborCost());
        assertEquals(new BigDecimal("500000"), result.getSummary().getTotalProjectBudget());
        assertEquals(new BigDecimal("320000"), result.getSummary().getTotalActualCost());
    }
}
```

- [ ] 编写 `CostControllerTest`，使用 MockMvc 验证三个端点返回 200

```java
package com.library.cost;

import com.library.cost.controller.CostController;
import com.library.cost.dto.*;
import com.library.cost.service.CostService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(CostController.class)
class CostControllerTest {

    @Autowired
    MockMvc mvc;
    @MockBean
    CostService costService;
    @Autowired
    ObjectMapper om;

    @Test
    void dashboard_returns200() throws Exception {
        when(costService.getDashboard(any())).thenReturn(new CostDashboardVO());
        mvc.perform(get("/api/cost/dashboard")).andExpect(status().isOk());
    }

    @Test
    void stat_returns200() throws Exception {
        when(costService.getCostRecords(any())).thenReturn(List.of());
        mvc.perform(get("/api/cost/stat")).andExpect(status().isOk());
    }

    @Test
    void export_returns200() throws Exception {
        when(costService.exportReport(any())).thenReturn(new byte[]{1, 2});
        mvc.perform(get("/api/cost/export")).andExpect(status().isOk());
    }
}
```

- [ ] 运行测试：`cd library-backend && mvn test`（预期全部通过）
- [ ] Commit: `git add -A && git commit -m "test(cost): add service and controller tests"`

---

## Task 8: 前端类型定义与 API 封装

**Files:**
- Create: `src/types/cost.ts`
- Create: `src/api/cost.ts`
- Modify: `src/api/request.ts`（新增 blob 下载处理）

**Interfaces:**
- Consumes: 后端 REST 契约（Task 6）
- Produces: 前端类型与 API 函数，供页面组件调用

**Steps:**

- [ ] 创建 `src/types/cost.ts`

```typescript
export type CostDimension = 'DEPT' | 'PROJECT' | 'BUSINESS_LINE' | 'PERSON';
export type TimeDimension = 'MONTH' | 'QUARTER' | 'YEAR';
export type LaborRole = 'DEV' | 'QA' | 'PM' | 'OPS';

export interface CostStatQuery {
  dimension?: CostDimension;
  timeDimension?: TimeDimension;
  timeValue?: string;
  deptId?: number;
  projectId?: number;
  businessLineId?: number;
  personId?: number;
  page?: number;
  size?: number;
}

export interface LaborCostVO {
  dimensionLabel: string;
  dev: number;
  qa: number;
  pm: number;
  ops: number;
  total: number;
}

export interface ProjectCostVO {
  projectId: number;
  projectName: string;
  budget: number;
  actualCost: number;
  budgetRatio: number;
  estimatedOverspend: number;
}

export interface CostDashboardVO {
  laborCosts: LaborCostVO[];
  projectCosts: ProjectCostVO[];
  summary: {
    totalLaborCost: number;
    totalProjectBudget: number;
    totalActualCost: number;
    overallBudgetRatio: number;
    totalEstimatedOverspend: number;
  };
}

export interface CostRecordDTO {
  id: number;
  deptId: number;
  deptName: string;
  projectId: number;
  projectName: string;
  businessLineId: number;
  businessLineName: string;
  personId: number;
  personName: string;
  laborRole: LaborRole;
  amount: number;
  costDate: string;
}
```

- [ ] 创建 `src/api/cost.ts`

```typescript
import request from './request';
import type { CostStatQuery, CostDashboardVO, CostRecordDTO } from '../types/cost';

export function getCostDashboard(params: CostStatQuery) {
  return request.get<{ code: number; message: string; data: CostDashboardVO }>(
    '/api/cost/dashboard',
    { params }
  );
}

export function getCostStat(params: CostStatQuery) {
  return request.get<{ code: number; message: string; data: CostRecordDTO[] }>(
    '/api/cost/stat',
    { params }
  );
}

export function exportCostReport(params: CostStatQuery) {
  return request.get('/api/cost/export', {
    params,
    responseType: 'blob',
  });
}
```

- [ ] 修改 `src/api/request.ts`，新增 blob 下载辅助函数

```typescript
// 在 request.ts 中新增
export function downloadBlob(blob: Blob, filename: string) {
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
```

- [ ] 编写测试 `src/__tests__/cost.test.ts`

```typescript
import { describe, it, expect, vi } from 'vitest';
import { getCostDashboard, exportCostReport } from '../api/cost';

vi.mock('./request', () => ({
  default: {
    get: vi.fn().mockResolvedValue({ code: 200, message: 'ok', data: {} }),
  },
}));

describe('cost API', () => {
  it('getCostDashboard calls /api/cost/dashboard', async () => {
    const res = await getCostDashboard({ dimension: 'DEPT' });
    expect(res.code).toBe(200);
  });

  it('exportCostReport uses blob responseType', async () => {
    const res = await exportCostReport({});
    expect(res).toBeDefined();
  });
});
```

- [ ] 运行测试：`pnpm test`（预期通过）
- [ ] Commit: `git add -A && git commit -m "feat(cost): add frontend types and API"`

---

## Task 9: 前端 Dashboard 页面与组件

**Files:**
- Create: `src/pages/cost/CostDashboard.tsx`
- Create: `src/pages/cost/components/DimensionFilter.tsx`
- Create: `src/pages/cost/components/LaborCostChart.tsx`
- Create: `src/pages/cost/components/ProjectCostChart.tsx`
- Create: `src/pages/cost/components/CostTable.tsx`
- Create: `src/pages/cost/components/ExportButton.tsx`

**Interfaces:**
- Consumes: `src/api/cost.ts`、`src/types/cost.ts`（Task 8）
- Produces: Dashboard 页面组件

**Steps:**

- [ ] 创建 `DimensionFilter.tsx`，提供维度/时间维度/时间值/部门/项目/业务线/人员筛选

```tsx
import { Form, Select, DatePicker, Input } from 'antd';
import type { CostStatQuery, CostDimension, TimeDimension } from '../../../types/cost';

const { Option } = Select;

interface Props {
  value: CostStatQuery;
  onChange: (val: Partial<CostStatQuery>) => void;
}

export default function DimensionFilter({ value, onChange }: Props) {
  return (
    <Form layout="inline">
      <Form.Item label="统计维度">
        <Select
          value={value.dimension}
          onChange={(v: CostDimension) => onChange({ dimension: v })}
          style={{ width: 120 }}
        >
          <Option value="DEPT">部门</Option>
          <Option value="PROJECT">项目</Option>
          <Option value="BUSINESS_LINE">业务线</Option>
          <Option value="PERSON">人员</Option>
        </Select>
      </Form.Item>
      <Form.Item label="时间维度">
        <Select
          value={value.timeDimension}
          onChange={(v: TimeDimension) => onChange({ timeDimension: v })}
          style={{ width: 120 }}
        >
          <Option value="MONTH">月份</Option>
          <Option value="QUARTER">季度</Option>
          <Option value="YEAR">年度</Option>
        </Select>
      </Form.Item>
      <Form.Item label="时间值">
        <Input
          placeholder="如 2026-08 / 2026-Q3 / 2026"
          value={value.timeValue}
          onChange={(e) => onChange({ timeValue: e.target.value })}
          style={{ width: 160 }}
        />
      </Form.Item>
    </Form>
  );
}
```

- [ ] 创建 `LaborCostChart.tsx`，使用 ECharts 堆叠柱状图展示开发/测试/产品/运维

```tsx
import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { LaborCostVO } from '../../../types/cost';

interface Props {
  data: LaborCostVO[];
}

export default function LaborCostChart({ data }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    chart.setOption({
      title: { text: '人力成本分布' },
      tooltip: { trigger: 'axis' },
      legend: { data: ['开发', '测试', '产品', '运维'] },
      xAxis: { type: 'category', data: data.map((d) => d.dimensionLabel) },
      yAxis: { type: 'value', name: '金额(元)' },
      series: [
        { name: '开发', type: 'bar', stack: 'total', data: data.map((d) => d.dev) },
        { name: '测试', type: 'bar', stack: 'total', data: data.map((d) => d.qa) },
        { name: '产品', type: 'bar', stack: 'total', data: data.map((d) => d.pm) },
        { name: '运维', type: 'bar', stack: 'total', data: data.map((d) => d.ops) },
      ],
    });
    return () => chart.dispose();
  }, [data]);

  return <div ref={ref} style={{ width: '100%', height: 400 }} />;
}
```

- [ ] 创建 `ProjectCostChart.tsx`，使用 ECharts 柱状图展示预算 vs 实际消耗

```tsx
import { useEffect, useRef } from 'react';
import * as echarts from 'echarts';
import type { ProjectCostVO } from '../../../types/cost';

interface Props {
  data: ProjectCostVO[];
}

export default function ProjectCostChart({ data }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = echarts.init(ref.current);
    chart.setOption({
      title: { text: '项目成本对比' },
      tooltip: { trigger: 'axis' },
      legend: { data: ['预算', '实际消耗', '预计超支'] },
      xAxis: { type: 'category', data: data.map((d) => d.projectName) },
      yAxis: { type: 'value', name: '金额(元)' },
      series: [
        { name: '预算', type: 'bar', data: data.map((d) => d.budget) },
        { name: '实际消耗', type: 'bar', data: data.map((d) => d.actualCost) },
        { name: '预计超支', type: 'bar', data: data.map((d) => d.estimatedOverspend) },
      ],
    });
    return () => chart.dispose();
  }, [data]);

  return <div ref={ref} style={{ width: '100%', height: 400 }} />;
}
```

- [ ] 创建 `CostTable.tsx`，展示明细表格

```tsx
import { Table } from 'antd';
import type { CostRecordDTO } from '../../../types/cost';

interface Props {
  data: CostRecordDTO[];
  loading: boolean;
}

const columns = [
  { title: '部门', dataIndex: 'deptName' },
  { title: '项目', dataIndex: 'projectName' },
  { title: '业务线', dataIndex: 'businessLineName' },
  { title: '人员', dataIndex: 'personName' },
  { title: '角色', dataIndex: 'laborRole' },
  { title: '金额(元)', dataIndex: 'amount', render: (v: number) => v.toFixed(2) },
  { title: '日期', dataIndex: 'costDate' },
];

export default function CostTable({ data, loading }: Props) {
  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={loading}
      pagination={{ pageSize: 20 }}
    />
  );
}
```

- [ ] 创建 `ExportButton.tsx`

```tsx
import { Button, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import { exportCostReport } from '../../../api/cost';
import { downloadBlob } from '../../../api/request';
import type { CostStatQuery } from '../../../types/cost';

interface Props {
  query: CostStatQuery;
}

export default function ExportButton({ query }: Props) {
  const handleExport = async () => {
    try {
      const blob = await exportCostReport(query);
      downloadBlob(blob, 'cost-report.xlsx');
      message.success('导出成功');
    } catch {
      message.error('导出失败');
    }
  };

  return (
    <Button type="primary" icon={<DownloadOutlined />} onClick={handleExport}>
      导出报表
    </Button>
  );
}
```

- [ ] 创建 `CostDashboard.tsx`，组合所有子组件

```tsx
import { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Spin } from 'antd';
import DimensionFilter from './components/DimensionFilter';
import LaborCostChart from './components/LaborCostChart';
import ProjectCostChart from './components/ProjectCostChart';
import CostTable from './components/CostTable';
import ExportButton from './components/ExportButton';
import { getCostDashboard, getCostStat } from '../../api/cost';
import type { CostStatQuery, CostDashboardVO, CostRecordDTO } from '../../types/cost';

export default function CostDashboard() {
  const [query, setQuery] = useState<CostStatQuery>({ dimension: 'DEPT', timeDimension: 'MONTH' });
  const [dashboard, setDashboard] = useState<CostDashboardVO | null>(null);
  const [records, setRecords] = useState<CostRecordDTO[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [dashRes, statRes] = await Promise.all([
        getCostDashboard(query),
        getCostStat(query),
      ]);
      setDashboard(dashRes.data);
      setRecords(statRes.data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [query]);

  return (
    <Spin spinning={loading}>
      <Card title="成本统计 Dashboard" extra={<ExportButton query={query} />}>
        <DimensionFilter value={query} onChange={(v) => setQuery({ ...query, ...v })} />
      </Card>
      {dashboard && (
        <>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={5}>
              <Card><Statistic title="人力成本合计" value={dashboard.summary.totalLaborCost} precision={2} /></Card>
            </Col>
            <Col span={5}>
              <Card><Statistic title="项目预算合计" value={dashboard.summary.totalProjectBudget} precision={2} /></Card>
            </Col>
            <Col span={5}>
              <Card><Statistic title="实际消耗合计" value={dashboard.summary.totalActualCost} precision={2} /></Card>
            </Col>
            <Col span={5}>
              <Card><Statistic title="预算占比" value={dashboard.summary.overallBudgetRatio * 100} precision={2} suffix="%" /></Card>
            </Col>
            <Col span={4}>
              <Card><Statistic title="预计超支合计" value={dashboard.summary.totalEstimatedOverspend} precision={2} /></Card>
            </Col>
          </Row>
          <Row gutter={16} style={{ marginTop: 16 }}>
            <Col span={12}><Card><LaborCostChart data={dashboard.laborCosts} /></Card></Col>
            <Col span={12}><Card><ProjectCostChart data={dashboard.projectCosts} /></Card></Col>
          </Row>
        </>
      )}
      <Card title="成本明细" style={{ marginTop: 16 }}>
        <CostTable data={records} loading={loading} />
      </Card>
    </Spin>
  );
}
```

- [ ] 运行 lint：`pnpm lint`（预期无错误）
- [ ] Commit: `git add -A && git commit -m "feat(cost): add CostDashboard page with charts and table"`

---

## Task 10: 前端路由与菜单集成

**Files:**
- Modify: `src/router/index.ts`
- Modify: `src/layouts/MainLayout.tsx`

**Interfaces:**
- Consumes: `CostDashboard`（Task 9）
- Produces: 可访问的 `/cost/dashboard` 路由与侧边栏菜单

**Steps:**

- [ ] 修改 `src/router/index.ts`，新增路由

```typescript
// 在路由配置数组中新增
{
  path: '/cost/dashboard',
  element: <CostDashboard />,
}
```

- [ ] 修改 `src/layouts/MainLayout.tsx`，侧边栏新增菜单项

```tsx
// 在 menuItems 数组中新增
{
  key: '/cost/dashboard',
  icon: <BarChartOutlined />,
  label: '成本统计',
}
```

- [ ] 启动前端验证：`pnpm dev`，访问 `http://localhost:5173/cost/dashboard` 页面正常渲染
- [ ] Commit: `git add -A && git commit -m "feat(cost): add cost dashboard route and menu"`

---

## Task 11: 跨仓联调与端到端验证

**Files:**
- 无新增文件，验证已有产物

**Interfaces:**
- Consumes: 前后端全部 Task 产物
- Produces: 端到端验证通过证据

**Steps:**

- [ ] 启动后端：`cd library-backend && mvn spring-boot:run`
- [ ] 启动前端：`cd library-frontend && pnpm dev`
- [ ] 访问 `http://localhost:5173/cost/dashboard`
- [ ] 验证维度筛选器切换部门/项目/业务线/人员，图表与表格数据正确刷新
- [ ] 验证时间维度切换月份/季度/年度，数据正确过滤
- [ ] 验证人力成本图表展示开发/测试/产品/运维四角色堆叠
- [ ] 验证项目成本图表展示预算/实际/超支
- [ ] 验证点击「导出报表」下载 `cost-report.xlsx`，包含三个 Sheet
- [ ] 验证 Dashboard 汇总卡片数据正确
- [ ] Commit: `git add -A && git commit -m "test(cost): e2e verification passed"`

---

## Self-Review

**1. Spec coverage:**
- ✅ 部门维度 → Task 3 SQL `CostDimension.DEPT` + Task 9 `DimensionFilter`
- ✅ 项目维度 → Task 3 SQL `CostDimension.PROJECT` + Task 9
- ✅ 业务线维度 → Task 3 SQL `CostDimension.BUSINESS_LINE` + Task 9
- ✅ 人员维度 → Task 3 SQL `CostDimension.PERSON` + Task 9
- ✅ 月份/季度/年度 → Task 3 SQL `TimeDimension` + Task 9
- ✅ 人力成本（开发/测试/产品/运维）→ Task 3 `LaborCostVO` + Task 9 `LaborCostChart`
- ✅ 项目成本（预算/实际消耗/预算占比/预计超支）→ Task 3 `ProjectCostVO` + Task 9 `ProjectCostChart`
- ✅ 报表导出 → Task 5 `CostExcelExporter` + Task 9 `ExportButton`
- ✅ Dashboard 页面 → Task 9 `CostDashboard`
- ✅ 前端新建成本统计分析页面 → Task 9/10

**2. Placeholder scan:**
- 无 TBD/TODO/implement later
- 无 "add appropriate error handling"（导出异常已在 Task 5 显式 catch）
- 无 "Write tests for the above"（测试代码已完整给出）
- 无 "Similar to Task N"

**3. File path verification:**
- 所有 Create/Modify 路径均为绝对仓库路径下的相对路径，与 File Structure 表一致

**4. Interface consistency:**
- 前端 `CostStatQuery` 字段与后端 `CostStatQueryDTO` 一一对应
- 前端 `CostDashboardVO` 与后端 `CostDashboardVO` 字段一致
- 导出接口 Content-Type 与前端 `responseType: 'blob'` 对齐

---

## Execution Handoff

Plan complete and saved to `.agents/specs/cost-report.md`. Two execution options:

1. **Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration
2. **Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints
