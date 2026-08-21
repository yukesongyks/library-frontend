### Task 2: 数据模型、表结构与种子数据

**Files:**
- Create: `library-backend/src/main/resources/schema.sql`（覆盖 Task 1 占位文件）
- Create: `library-backend/src/main/resources/data.sql`（覆盖 Task 1 占位文件）
- Create: `library-backend/src/main/java/com/library/cost/entity/Department.java`
- Create: `library-backend/src/main/java/com/library/cost/entity/BusinessLine.java`
- Create: `library-backend/src/main/java/com/library/cost/entity/Project.java`
- Create: `library-backend/src/main/java/com/library/cost/entity/Employee.java`
- Create: `library-backend/src/main/java/com/library/cost/entity/LaborCost.java`
- Create: `library-backend/src/main/java/com/library/cost/entity/ProjectCost.java`
- Create: `library-backend/src/main/java/com/library/cost/mapper/DepartmentMapper.java`
- Create: `library-backend/src/main/java/com/library/cost/mapper/BusinessLineMapper.java`
- Create: `library-backend/src/main/java/com/library/cost/mapper/ProjectMapper.java`
- Create: `library-backend/src/main/java/com/library/cost/mapper/EmployeeMapper.java`
- Create: `library-backend/src/main/java/com/library/cost/mapper/LaborCostMapper.java`
- Create: `library-backend/src/main/java/com/library/cost/mapper/ProjectCostMapper.java`
- Test: `library-backend/src/test/java/com/library/cost/SeedDataMapperTest.java`

**Interfaces:**
- Produces: 6 张表与 6 个 `BaseMapper<T>`；实体字段与表列一一对应（下划线↔驼峰）。

- [ ] **Step 1: 创建 `schema.sql`**

```sql
DROP TABLE IF EXISTS labor_cost;
DROP TABLE IF EXISTS project_cost;
DROP TABLE IF EXISTS project;
DROP TABLE IF EXISTS employee;
DROP TABLE IF EXISTS department;
DROP TABLE IF EXISTS business_line;

CREATE TABLE department (
  id   BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(64)  NOT NULL,
  code VARCHAR(32)  NOT NULL UNIQUE
);

CREATE TABLE business_line (
  id   BIGINT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(64)  NOT NULL,
  code VARCHAR(32)  NOT NULL UNIQUE
);

CREATE TABLE project (
  id              BIGINT PRIMARY KEY AUTO_INCREMENT,
  name            VARCHAR(128) NOT NULL,
  code            VARCHAR(32)  NOT NULL UNIQUE,
  business_line_id BIGINT      NOT NULL,
  department_id   BIGINT       NOT NULL,
  budget_amount   DECIMAL(12,2) NOT NULL DEFAULT 0
);

CREATE TABLE employee (
  id            BIGINT PRIMARY KEY AUTO_INCREMENT,
  name          VARCHAR(64) NOT NULL,
  employee_no   VARCHAR(32) NOT NULL UNIQUE,
  department_id BIGINT      NOT NULL,
  role          VARCHAR(16) NOT NULL
);

CREATE TABLE labor_cost (
  id          BIGINT PRIMARY KEY AUTO_INCREMENT,
  employee_id BIGINT       NOT NULL,
  project_id  BIGINT       NOT NULL,
  month       VARCHAR(7)   NOT NULL,
  amount      DECIMAL(12,2) NOT NULL DEFAULT 0
);

CREATE TABLE project_cost (
  id           BIGINT PRIMARY KEY AUTO_INCREMENT,
  project_id   BIGINT       NOT NULL,
  month        VARCHAR(7)   NOT NULL,
  actual_amount DECIMAL(12,2) NOT NULL DEFAULT 0
);

CREATE INDEX idx_labor_month ON labor_cost(month);
CREATE INDEX idx_project_cost_month ON project_cost(month);
```

- [ ] **Step 2: 创建 `data.sql`（种子数据，含验收基准数值）**

```sql
INSERT INTO department (id, name, code) VALUES
  (1, '研发部', 'DEV-DEPT'),
  (2, '产品部', 'PM-DEPT');

INSERT INTO business_line (id, name, code) VALUES
  (1, '金融科技线', 'FINTECH'),
  (2, '数字企业线', 'DIGITAL');

INSERT INTO project (id, name, code, business_line_id, department_id, budget_amount) VALUES
  (1, '核心交易系统', 'TRADE',   1, 1, 1000000.00),
  (2, '数据中台',     'DATAPLT', 1, 1,  400000.00),
  (3, '客户门户',     'PORTAL',  2, 2,  600000.00),
  (4, '运维支撑平台', 'OPSPLT',  2, 1,  400000.00);

INSERT INTO employee (id, name, employee_no, department_id, role) VALUES
  (1, '张三', 'P001', 1, 'DEV'),
  (2, '李四', 'P002', 1, 'TEST'),
  (3, '王五', 'P003', 2, 'PM'),
  (4, '赵六', 'P004', 1, 'OPS');

INSERT INTO labor_cost (employee_id, project_id, month, amount) VALUES
  (1, 1, '2025-01', 20000.00), (2, 1, '2025-01', 15000.00), (3, 3, '2025-01', 18000.00), (4, 4, '2025-01', 16000.00),
  (1, 1, '2025-02', 20000.00), (2, 1, '2025-02', 15000.00), (3, 3, '2025-02', 18000.00), (4, 4, '2025-02', 16000.00),
  (1, 1, '2025-03', 20000.00), (2, 1, '2025-03', 15000.00), (3, 3, '2025-03', 18000.00), (4, 4, '2025-03', 16000.00),
  (1, 1, '2025-04', 20000.00), (2, 1, '2025-04', 15000.00), (3, 3, '2025-04', 18000.00), (4, 4, '2025-04', 16000.00),
  (1, 1, '2025-05', 20000.00), (2, 1, '2025-05', 15000.00), (3, 3, '2025-05', 18000.00), (4, 4, '2025-05', 16000.00),
  (1, 1, '2025-06', 20000.00), (2, 1, '2025-06', 15000.00), (3, 3, '2025-06', 18000.00), (4, 4, '2025-06', 16000.00);

INSERT INTO project_cost (project_id, month, actual_amount) VALUES
  (1, '2025-01', 100000.00), (2, '2025-01', 80000.00), (3, '2025-01', 50000.00), (4, '2025-01', 35000.00),
  (1, '2025-02', 100000.00), (2, '2025-02', 80000.00), (3, '2025-02', 50000.00), (4, '2025-02', 35000.00),
  (1, '2025-03', 100000.00), (2, '2025-03', 80000.00), (3, '2025-03', 50000.00), (4, '2025-03', 35000.00),
  (1, '2025-04', 100000.00), (2, '2025-04', 80000.00), (3, '2025-04', 50000.00), (4, '2025-04', 35000.00),
  (1, '2025-05', 100000.00), (2, '2025-05', 80000.00), (3, '2025-05', 50000.00), (4, '2025-05', 35000.00),
  (1, '2025-06', 100000.00), (2, '2025-06', 80000.00), (3, '2025-06', 50000.00), (4, '2025-06', 35000.00);
```

> 基准数值（Task 3/4 测试断言依据，2025 全年）：人力成本 414000.00；项目实际 1590000.00；总成本 2004000.00；人力占比 20.66%；项目占比 79.34%；预算合计 2400000.00；超支项目数 1（数据中台：实际 480000 > 预算 400000，超支 80000.00）；研发部（dept 1）人力 306000.00/预算 1800000.00/实际 1290000.00/占比 71.67%；产品部（dept 2）人力 108000.00/预算 600000.00/实际 300000.00/占比 50.00%。

- [ ] **Step 3: 创建 6 个实体类（B 站模式：@Data + @TableName）**

```java
package com.library.cost.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("department")
public class Department {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String code;
}
```

```java
package com.library.cost.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("business_line")
public class BusinessLine {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String code;
}
```

```java
package com.library.cost.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;

@Data
@TableName("project")
public class Project {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String code;
    private Long businessLineId;
    private Long departmentId;
    private BigDecimal budgetAmount;
}
```

```java
package com.library.cost.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;

@Data
@TableName("employee")
public class Employee {
    @TableId(type = IdType.AUTO)
    private Long id;
    private String name;
    private String employeeNo;
    private Long departmentId;
    private String role;
}
```

```java
package com.library.cost.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;

@Data
@TableName("labor_cost")
public class LaborCost {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long employeeId;
    private Long projectId;
    private String month;
    private BigDecimal amount;
}
```

```java
package com.library.cost.entity;

import com.baomidou.mybatisplus.annotation.IdType;
import com.baomidou.mybatisplus.annotation.TableId;
import com.baomidou.mybatisplus.annotation.TableName;
import lombok.Data;
import java.math.BigDecimal;

@Data
@TableName("project_cost")
public class ProjectCost {
    @TableId(type = IdType.AUTO)
    private Long id;
    private Long projectId;
    private String month;
    private BigDecimal actualAmount;
}
```

- [ ] **Step 4: 创建 6 个 Mapper（BaseMapper 模板）**

以 `DepartmentMapper` 为例，其余 5 个仅类名/实体类型不同：

```java
package com.library.cost.mapper;

import com.baomidou.mybatisplus.core.mapper.BaseMapper;
import com.library.cost.entity.Department;
import org.apache.ibatis.annotations.Mapper;

@Mapper
public interface DepartmentMapper extends BaseMapper<Department> {
}
```

其余 5 个文件：
- `BusinessLineMapper extends BaseMapper<BusinessLine>`
- `ProjectMapper extends BaseMapper<Project>`
- `EmployeeMapper extends BaseMapper<Employee>`
- `LaborCostMapper extends BaseMapper<LaborCost>`
- `ProjectCostMapper extends BaseMapper<ProjectCost>`
- 每个文件与上述完全同构（`@Mapper` + `extends BaseMapper<对应实体>`），以 `BusinessLine` 建立各文件。

- [ ] **Step 5: 编写种子数据验证测试 `SeedDataMapperTest.java`**

```java
package com.library.cost;

import com.baomidou.mybatisplus.core.conditions.query.QueryWrapper;
import com.library.cost.entity.Department;
import com.library.cost.entity.LaborCost;
import com.library.cost.entity.ProjectCost;
import com.library.cost.mapper.DepartmentMapper;
import com.library.cost.mapper.LaborCostMapper;
import com.library.cost.mapper.ProjectCostMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import java.math.BigDecimal;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
class SeedDataMapperTest {

    @Autowired
    private DepartmentMapper departmentMapper;
    @Autowired
    private LaborCostMapper laborCostMapper;
    @Autowired
    private ProjectCostMapper projectCostMapper;

    @Test
    void seedDataLoaded() {
        assertThat(departmentMapper.selectList(null)).hasSize(2);
        List<LaborCost> laborCosts = laborCostMapper.selectList(new QueryWrapper<>());
        assertThat(laborCosts).hasSize(24);
        BigDecimal totalLabor = laborCosts.stream()
                .map(LaborCost::getAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(totalLabor).isEqualByComparingTo("414000.00");

        List<ProjectCost> projectCosts = projectCostMapper.selectList(new QueryWrapper<>());
        assertThat(projectCosts).hasSize(24);
        BigDecimal totalActual = projectCosts.stream()
                .map(ProjectCost::getActualAmount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        assertThat(totalActual).isEqualByComparingTo("1590000.00");
    }
}
```

- [ ] **Step 6: 运行测试**

Run: `cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main && mvn -q test`
Expected: `BUILD SUCCESS`；新增测试 2 项全过（schema/data 正确加载、聚合基准数值匹配）。

- [ ] **Step 7: Commit**

```bash
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main
git add src/main/resources/schema.sql src/main/resources/data.sql src/main/java/com/library/cost/entity src/main/java/com/library/cost/mapper src/test/java/com/library/cost/SeedDataMapperTest.java
git commit -m "feat: 建成本统计表结构、种子数据与实体/Mapper

Co-authored-by: DTCoder <noreply@dtcoder.local>"
```

