### Task 3: 统计服务（聚合引擎）

**Files:**
- Create: `library-backend/src/main/java/com/library/cost/dto/LaborCostRow.java`
- Create: `library-backend/src/main/java/com/library/cost/dto/ProjectCostRow.java`
- Create: `library-backend/src/main/java/com/library/cost/dto/MonthlyTrendItem.java`
- Create: `library-backend/src/main/java/com/library/cost/dto/CostSummaryDTO.java`
- Create: `library-backend/src/main/java/com/library/cost/dto/CostAnalysisItem.java`
- Create: `library-backend/src/main/java/com/library/cost/dto/AnalysisResponse.java`
- Create: `library-backend/src/main/java/com/library/cost/dto/AnalysisQuery.java`
- Create: `library-backend/src/main/java/com/library/cost/mapper/CostReportMapper.java`
- Create: `library-backend/src/main/java/com/library/cost/service/CostService.java`
- Create: `library-backend/src/main/java/com/library/cost/service/CostServiceImpl.java`
- Test: `library-backend/src/test/java/com/library/cost/CostServiceImplTest.java`

**Interfaces:**
- Consumes: Task 2 的 6 个 `BaseMapper`、`LaborCostRow`/`ProjectCostRow`（由 `CostReportMapper` 的 `@Select` 返回）。
- Produces:
  - `CostService.summary(String year) → CostSummaryDTO`
  - `CostService.analysis(AnalysisQuery) → AnalysisResponse`
  - `CostService.queryItems(AnalysisQuery) → List<CostAnalysisItem>`

- [ ] **Step 1: 创建行 DTO（report mapper 返回类型，record）**

```java
package com.library.cost.dto;

import java.math.BigDecimal;

public record LaborCostRow(Long projectId, String month, BigDecimal amount,
                           String role, Long departmentId, Long businessLineId,
                           Long employeeId) {
}
```

```java
package com.library.cost.dto;

import java.math.BigDecimal;

public record ProjectCostRow(Long projectId, String month, BigDecimal actualAmount,
                             Long departmentId, Long businessLineId,
                             BigDecimal budgetAmount) {
}
```

- [ ] **Step 2: 创建结果 DTO**

```java
package com.library.cost.dto;

import java.math.BigDecimal;
import java.util.List;

public record MonthlyTrendItem(String month, BigDecimal laborCost,
                               BigDecimal projectCost, BigDecimal totalCost) {
}
```

```java
package com.library.cost.dto;

import java.math.BigDecimal;
import java.util.List;

public record CostSummaryDTO(BigDecimal totalCost, BigDecimal laborCost,
                             BigDecimal projectCost, double laborRatio,
                             double projectRatio, int overBudgetCount,
                             List<MonthlyTrendItem> monthlyTrend) {
}
```

```java
package com.library.cost.dto;

import java.math.BigDecimal;

public record CostAnalysisItem(String name, BigDecimal laborCost,
                               BigDecimal projectBudget, BigDecimal projectActual,
                               double budgetRatio, BigDecimal overBudgetAmount) {
}
```

```java
package com.library.cost.dto;

import java.util.List;

public record AnalysisResponse(List<CostAnalysisItem> records, long total) {
}
```

```java
package com.library.cost.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AnalysisQuery {
    private String dimension;
    private String year;
    private String month;
    private String quarter;
    private String role;
}
```

- [ ] **Step 3: 创建 `CostReportMapper`（两张聚合事实查询）**

```java
package com.library.cost.mapper;

import com.library.cost.dto.LaborCostRow;
import com.library.cost.dto.ProjectCostRow;
import org.apache.ibatis.annotations.Mapper;
import org.apache.ibatis.annotations.Param;
import org.apache.ibatis.annotations.Select;

import java.util.List;

@Mapper
public interface CostReportMapper {

    @Select("""
            SELECT lc.project_id AS projectId, lc.month AS month, lc.amount AS amount,
                   e.role AS role, e.department_id AS departmentId,
                   p.business_line_id AS businessLineId, lc.employee_id AS employeeId
            FROM labor_cost lc
            JOIN employee e ON lc.employee_id = e.id
            JOIN project p ON lc.project_id = p.id
            WHERE lc.month LIKE CONCAT(#{year}, '%')
            """)
    List<LaborCostRow> selectLaborRows(@Param("year") String year);

    @Select("""
            SELECT pc.project_id AS projectId, pc.month AS month,
                   pc.actual_amount AS actualAmount,
                   p.department_id AS departmentId,
                   p.business_line_id AS businessLineId,
                   p.budget_amount AS budgetAmount
            FROM project_cost pc
            JOIN project p ON pc.project_id = p.id
            WHERE pc.month LIKE CONCAT(#{year}, '%')
            """)
    List<ProjectCostRow> selectProjectCostRows(@Param("year") String year);
}
```

- [ ] **Step 4: 创建 `CostService` 接口**

```java
package com.library.cost.service;

import com.library.cost.dto.AnalysisQuery;
import com.library.cost.dto.AnalysisResponse;
import com.library.cost.dto.CostAnalysisItem;
import com.library.cost.dto.CostSummaryDTO;

import java.util.List;

public interface CostService {

    CostSummaryDTO summary(String year);

    AnalysisResponse analysis(AnalysisQuery query);

    List<CostAnalysisItem> queryItems(AnalysisQuery query);
}
```

- [ ] **Step 5: 创建 `CostServiceImpl`（核心聚合实现）**

```java
package com.library.cost.service;

import com.library.cost.dto.AnalysisQuery;
import com.library.cost.dto.AnalysisResponse;
import com.library.cost.dto.CostAnalysisItem;
import com.library.cost.dto.CostSummaryDTO;
import com.library.cost.dto.LaborCostRow;
import com.library.cost.dto.MonthlyTrendItem;
import com.library.cost.dto.ProjectCostRow;
import com.library.cost.entity.Project;
import com.library.cost.mapper.BusinessLineMapper;
import com.library.cost.mapper.CostReportMapper;
import com.library.cost.mapper.DepartmentMapper;
import com.library.cost.mapper.EmployeeMapper;
import com.library.cost.mapper.ProjectMapper;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.TreeSet;
import java.util.stream.Collectors;

@Service
public class CostServiceImpl implements CostService {

    private static final BigDecimal HUNDRED = new BigDecimal("100");
    private static final Set<String> DIMENSIONS = Set.of(
            "department", "project", "business_line", "employee", "month", "quarter", "year");
    private static final Set<String> ROLES = Set.of("DEV", "TEST", "PM", "OPS");

    private final CostReportMapper costReportMapper;
    private final DepartmentMapper departmentMapper;
    private final BusinessLineMapper businessLineMapper;
    private final EmployeeMapper employeeMapper;
    private final ProjectMapper projectMapper;

    public CostServiceImpl(CostReportMapper costReportMapper, DepartmentMapper departmentMapper,
                           BusinessLineMapper businessLineMapper, EmployeeMapper employeeMapper,
                           ProjectMapper projectMapper) {
        this.costReportMapper = costReportMapper;
        this.departmentMapper = departmentMapper;
        this.businessLineMapper = businessLineMapper;
        this.employeeMapper = employeeMapper;
        this.projectMapper = projectMapper;
    }

    @Override
    public CostSummaryDTO summary(String year) {
        String resolvedYear = resolveYear(year);
        List<LaborCostRow> laborRows = costReportMapper.selectLaborRows(resolvedYear);
        List<ProjectCostRow> costRows = costReportMapper.selectProjectCostRows(resolvedYear);

        BigDecimal laborCost = sumAmounts(laborRows.stream().map(LaborCostRow::amount).toList());
        BigDecimal projectCost = sumAmounts(costRows.stream().map(ProjectCostRow::actualAmount).toList());
        BigDecimal totalCost = laborCost.add(projectCost);

        Set<String> months = new TreeSet<>();
        laborRows.forEach(r -> months.add(r.month()));
        costRows.forEach(r -> months.add(r.month()));
        List<MonthlyTrendItem> trend = new ArrayList<>();
        for (String month : months) {
            BigDecimal ml = sumAmounts(laborRows.stream()
                    .filter(r -> r.month().equals(month)).map(LaborCostRow::amount).toList());
            BigDecimal mp = sumAmounts(costRows.stream()
                    .filter(r -> r.month().equals(month)).map(ProjectCostRow::actualAmount).toList());
            trend.add(new MonthlyTrendItem(month, ml, mp, ml.add(mp)));
        }

        Map<Long, ProjectTotals> byProject = buildProjectTotals(costRows);
        long overBudget = byProject.values().stream()
                .filter(t -> t.actual.compareTo(t.budget) > 0)
                .count();

        return new CostSummaryDTO(
                totalCost, laborCost, projectCost,
                ratio(laborCost, totalCost), ratio(projectCost, totalCost),
                (int) overBudget, trend);
    }

    @Override
    public AnalysisResponse analysis(AnalysisQuery query) {
        List<CostAnalysisItem> items = queryItems(query);
        return new AnalysisResponse(items, items.size());
    }

    @Override
    public List<CostAnalysisItem> queryItems(AnalysisQuery query) {
        String dimension = requireDimension(query.getDimension());
        String resolvedYear = resolveYear(query.getYear());
        String month = blankToNull(query.getMonth());
        String quarter = blankToNull(query.getQuarter());
        String role = blankToNull(query.getRole());
        validatePeriod(month, quarter);
        if (role != null && !ROLES.contains(role.toUpperCase())) {
            throw new IllegalArgumentException("不支持的岗位角色: " + role);
        }

        List<LaborCostRow> laborRows = costReportMapper.selectLaborRows(resolvedYear).stream()
                .filter(r -> matchesPeriod(r.month(), month, quarter))
                .filter(r -> role == null || r.role().equalsIgnoreCase(role))
                .toList();
        List<ProjectCostRow> costRows = costReportMapper.selectProjectCostRows(resolvedYear).stream()
                .filter(r -> matchesPeriod(r.month(), month, quarter))
                .toList();

        Map<Long, Project> projectsById = projectMapper.selectList(null).stream()
                .collect(Collectors.toMap(Project::getId, p -> p));

        Map<String, BigDecimal> laborByKey = new LinkedHashMap<>();
        for (LaborCostRow r : laborRows) {
            laborByKey.merge(laborDimKey(r, dimension, resolvedYear), r.amount(), BigDecimal::add);
        }

        // 员工 → 参与项目 映射（用于 employee 维度与角色过滤联动）
        Map<Long, Set<Long>> projectEmployeeIds = new HashMap<>();
        for (LaborCostRow r : laborRows) {
            projectEmployeeIds.computeIfAbsent(r.projectId(), k -> new HashSet<>()).add(r.employeeId());
        }

        Map<String, CostAgg> aggByKey = new LinkedHashMap<>();
        Set<String> projectBudgetKeys = new HashSet<>();
        for (ProjectCostRow row : costRows) {
            Project project = projectsById.get(row.projectId());
            if (project == null) {
                continue;
            }
            List<String> keys = isTimeDimension(dimension)
                    ? List.of(timeKey(row.month(), dimension, resolvedYear))
                    : entityDimKeys(project, dimension, projectEmployeeIds.getOrDefault(row.projectId(), Set.of()));
            for (String key : keys) {
                CostAgg agg = aggByKey.computeIfAbsent(key, k -> new CostAgg());
                agg.projectActual = agg.projectActual.add(row.actualAmount());
                String budgetKey = key + "#" + row.projectId();
                if (projectBudgetKeys.add(budgetKey)) {
                    agg.projectBudget = agg.projectBudget.add(row.budgetAmount());
                }
            }
        }
        for (Map.Entry<String, BigDecimal> e : laborByKey.entrySet()) {
            aggByKey.computeIfAbsent(e.getKey(), k -> new CostAgg()).laborCost = e.getValue();
        }

        Map<String, String> names = dimNames(dimension, projectsById);
        List<CostAnalysisItem> items = new ArrayList<>();
        for (Map.Entry<String, CostAgg> e : aggByKey.entrySet()) {
            CostAgg a = e.getValue();
            String label = isTimeDimension(dimension) ? e.getKey() : names.getOrDefault(e.getKey(), e.getKey());
            items.add(new CostAnalysisItem(
                    label,
                    a.laborCost,
                    a.projectBudget,
                    a.projectActual,
                    ratio(a.projectActual, a.projectBudget),
                    a.projectActual.subtract(a.projectBudget)));
        }
        items.sort(Comparator.comparing(CostAnalysisItem::laborCost).reversed()
                .thenComparing(CostAnalysisItem::name));
        return items;
    }

    // ---------- helpers ----------

    private String requireDimension(String dimension) {
        if (dimension == null || !DIMENSIONS.contains(dimension)) {
            throw new IllegalArgumentException("不支持的统计维度: " + dimension);
        }
        return dimension;
    }

    private String resolveYear(String year) {
        String y = blankToNull(year);
        if (y == null) {
            return String.valueOf(LocalDate.now().getYear());
        }
        if (!y.matches("\\d{4}")) {
            throw new IllegalArgumentException("年份格式应为 YYYY: " + year);
        }
        return y;
    }

    private void validatePeriod(String month, String quarter) {
        if (month != null && !month.matches("\\d{4}-(0[1-9]|1[0-2])")) {
            throw new IllegalArgumentException("月份格式应为 YYYY-MM: " + month);
        }
        if (quarter != null && !quarter.matches("Q[1-4]")) {
            throw new IllegalArgumentException("季度格式应为 Q1-Q4: " + quarter);
        }
    }

    private boolean matchesPeriod(String rowMonth, String month, String quarter) {
        if (month != null && !rowMonth.equals(month)) {
            return false;
        }
        return quarter == null || quarterOf(rowMonth).equals(quarter);
    }

    private boolean isTimeDimension(String dimension) {
        return "month".equals(dimension) || "quarter".equals(dimension) || "year".equals(dimension);
    }

    private String timeKey(String month, String dimension, String year) {
        return switch (dimension) {
            case "month" -> month;
            case "quarter" -> year + "-" + quarterOf(month);
            case "year" -> year;
            default -> "";
        };
    }

    private String laborDimKey(LaborCostRow row, String dimension, String year) {
        return switch (dimension) {
            case "department" -> String.valueOf(row.departmentId());
            case "project" -> String.valueOf(row.projectId());
            case "business_line" -> String.valueOf(row.businessLineId());
            case "employee" -> String.valueOf(row.employeeId());
            case "month" -> row.month();
            case "quarter" -> year + "-" + quarterOf(row.month());
            case "year" -> year;
            default -> throw new IllegalArgumentException("不支持的统计维度: " + dimension);
        };
    }

    private List<String> entityDimKeys(Project project, String dimension, Set<Long> employeeIds) {
        return switch (dimension) {
            case "department" -> List.of(String.valueOf(project.getDepartmentId()));
            case "project" -> List.of(String.valueOf(project.getId()));
            case "business_line" -> List.of(String.valueOf(project.getBusinessLineId()));
            case "employee" -> employeeIds.stream().map(String::valueOf).distinct().toList();
            default -> List.of();
        };
    }

    private Map<String, String> dimNames(String dimension, Map<Long, Project> projectsById) {
        Map<String, String> names = new HashMap<>();
        switch (dimension) {
            case "department" -> departmentMapper.selectList(null)
                    .forEach(d -> names.put(String.valueOf(d.getId()), d.getName()));
            case "project" -> projectsById.forEach((id, p) -> names.put(String.valueOf(id), p.getName()));
            case "business_line" -> businessLineMapper.selectList(null)
                    .forEach(b -> names.put(String.valueOf(b.getId()), b.getName()));
            case "employee" -> employeeMapper.selectList(null)
                    .forEach(e -> names.put(String.valueOf(e.getId()), e.getName()));
            default -> { }
        }
        return names;
    }

    private Map<Long, ProjectTotals> buildProjectTotals(List<ProjectCostRow> rows) {
        Map<Long, ProjectTotals> map = new LinkedHashMap<>();
        for (ProjectCostRow row : rows) {
            ProjectTotals t = map.computeIfAbsent(row.projectId(), k -> new ProjectTotals());
            t.actual = t.actual.add(row.actualAmount());
            t.budget = row.budgetAmount();
        }
        return map;
    }

    private BigDecimal sumAmounts(List<BigDecimal> amounts) {
        return amounts.stream().reduce(BigDecimal.ZERO, BigDecimal::add);
    }

    private double ratio(BigDecimal part, BigDecimal whole) {
        if (whole == null || whole.compareTo(BigDecimal.ZERO) == 0) {
            return 0.0;
        }
        return part.multiply(HUNDRED).divide(whole, 2, RoundingMode.HALF_UP).doubleValue();
    }

    private String quarterOf(String month) {
        int m = Integer.parseInt(month.substring(5, 7));
        return "Q" + ((m - 1) / 3 + 1);
    }

    private String blankToNull(String s) {
        return (s == null || s.isBlank()) ? null : s.trim();
    }

    private static class CostAgg {
        BigDecimal laborCost = BigDecimal.ZERO;
        BigDecimal projectBudget = BigDecimal.ZERO;
        BigDecimal projectActual = BigDecimal.ZERO;
    }

    private static class ProjectTotals {
        BigDecimal actual = BigDecimal.ZERO;
        BigDecimal budget = BigDecimal.ZERO;
    }
}
```

- [ ] **Step 6: 编写单元测试 `CostServiceImplTest.java`**

```java
package com.library.cost;

import com.library.cost.dto.AnalysisQuery;
import com.library.cost.dto.CostAnalysisItem;
import com.library.cost.dto.CostSummaryDTO;
import com.library.cost.dto.LaborCostRow;
import com.library.cost.dto.ProjectCostRow;
import com.library.cost.entity.Department;
import com.library.cost.entity.Employee;
import com.library.cost.entity.Project;
import com.library.cost.mapper.BusinessLineMapper;
import com.library.cost.mapper.CostReportMapper;
import com.library.cost.mapper.DepartmentMapper;
import com.library.cost.mapper.EmployeeMapper;
import com.library.cost.mapper.ProjectMapper;
import com.library.cost.service.CostServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class CostServiceImplTest {

    private CostServiceImpl service;
    private CostReportMapper reportMapper;

    @BeforeEach
    void setUp() {
        reportMapper = mock(CostReportMapper.class);
        DepartmentMapper departmentMapper = mock(DepartmentMapper.class);
        BusinessLineMapper businessLineMapper = mock(BusinessLineMapper.class);
        EmployeeMapper employeeMapper = mock(EmployeeMapper.class);
        ProjectMapper projectMapper = mock(ProjectMapper.class);

        when(departmentMapper.selectList(any())).thenReturn(List.of(
                dept(1L, "研发部"), dept(2L, "产品部")));
        when(employeeMapper.selectList(any())).thenReturn(List.of(
                emp(1L, "张三"), emp(2L, "李四")));
        when(projectMapper.selectList(any())).thenReturn(List.of(
                proj(1L, "核心交易系统", 1L, 1L, new BigDecimal("1000000.00"))));

        when(reportMapper.selectLaborRows("2025")).thenReturn(List.of(
                new LaborCostRow(1L, "2025-01", new BigDecimal("20000.00"), "DEV", 1L, 1L, 1L),
                new LaborCostRow(1L, "2025-02", new BigDecimal("20000.00"), "DEV", 1L, 1L, 1L),
                new LaborCostRow(1L, "2025-01", new BigDecimal("15000.00"), "TEST", 1L, 1L, 2L)));
        when(reportMapper.selectProjectCostRows("2025")).thenReturn(List.of(
                new ProjectCostRow(1L, "2025-01", new BigDecimal("50000.00"), 1L, 1L, new BigDecimal("1000000.00")),
                new ProjectCostRow(1L, "2025-02", new BigDecimal("50000.00"), 1L, 1L, new BigDecimal("1000000.00"))));

        service = new CostServiceImpl(reportMapper, departmentMapper, businessLineMapper,
                employeeMapper, projectMapper);
    }

    private Department dept(Long id, String name) {
        Department d = new Department();
        d.setId(id);
        d.setName(name);
        d.setCode("C" + id);
        return d;
    }

    private Employee emp(Long id, String name) {
        Employee e = new Employee();
        e.setId(id);
        e.setName(name);
        e.setEmployeeNo("P" + id);
        return e;
    }

    private Project proj(Long id, String name, Long lineId, Long deptId, BigDecimal budget) {
        Project p = new Project();
        p.setId(id);
        p.setName(name);
        p.setCode("CODE" + id);
        p.setBusinessLineId(lineId);
        p.setDepartmentId(deptId);
        p.setBudgetAmount(budget);
        return p;
    }

    @Test
    void summaryAggregatesTotalsAndTrend() {
        CostSummaryDTO s = service.summary("2025");
        assertThat(s.totalCost()).isEqualByComparingTo("155000.00");
        assertThat(s.laborCost()).isEqualByComparingTo("55000.00");
        assertThat(s.projectCost()).isEqualByComparingTo("100000.00");
        assertThat(s.laborRatio()).isEqualTo(35.48);
        assertThat(s.projectRatio()).isEqualTo(64.52);
        assertThat(s.monthlyTrend()).hasSize(2);
        assertThat(s.monthlyTrend().get(0).month()).isEqualTo("2025-01");
    }

    @Test
    void departmentDimensionGroupsByDepartment() {
        AnalysisQuery query = new AnalysisQuery("department", "2025", null, null, null);
        List<CostAnalysisItem> items = service.queryItems(query);
        assertThat(items).hasSize(1);
        CostAnalysisItem item = items.get(0);
        assertThat(item.name()).isEqualTo("研发部");
        assertThat(item.laborCost()).isEqualByComparingTo("55000.00");
        assertThat(item.projectBudget()).isEqualByComparingTo("1000000.00");
        assertThat(item.projectActual()).isEqualByComparingTo("100000.00");
        assertThat(item.budgetRatio()).isEqualTo(10.00);
    }

    @Test
    void roleFilterRestrictsLaborRows() {
        AnalysisQuery query = new AnalysisQuery("employee", "2025", null, null, "DEV");
        List<CostAnalysisItem> items = service.queryItems(query);
        assertThat(items).hasSize(1);
        assertThat(items.get(0).laborCost()).isEqualByComparingTo("40000.00");
    }

    @Test
    void invalidDimensionRejected() {
        AnalysisQuery query = new AnalysisQuery("bad", "2025", null, null, null);
        try {
            service.queryItems(query);
            assertThat(false).isTrue();
        } catch (IllegalArgumentException ex) {
            assertThat(ex.getMessage()).contains("不支持的统计维度");
        }
    }
}
```

- [ ] **Step 7: 运行测试**

Run: `cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main && mvn -q test`
Expected: `BUILD SUCCESS`；`CostServiceImplTest` 4 项全过（汇总、部门分组、角色过滤、非法维度）。

> 数值核对（Step 6 用例数据）：人力 55000.00（张三 20000×2月 + 李四 15000×1月）、项目实际 100000.00（项目1 50000×2月）、预算 1000000.00 → 总成本 155000.00、laborRatio 35.48、projectRatio 64.52、预算占比 10.00、role=DEV 时人力 40000.00（张三 20000×2月）。Step 6 代码块内断言即按此编写。

- [ ] **Step 8: Commit**

```bash
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main
git add src/main/java/com/library/cost/dto src/main/java/com/library/cost/mapper/CostReportMapper.java src/main/java/com/library/cost/service src/test/java/com/library/cost/CostServiceImplTest.java
git commit -m "feat: 实现成本统计聚合服务与单元测试

Co-authored-by: DTCoder <noreply@dtcoder.local>"
```

