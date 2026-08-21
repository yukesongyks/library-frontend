### Task 4: 总览与统计分析接口

**Files:**
- Create: `library-backend/src/main/java/com/library/cost/controller/CostController.java`
- Test: `library-backend/src/test/java/com/library/cost/CostApiIntegrationTest.java`

**Interfaces:**
- Consumes: Task 3 的 `CostService`；Task 1 的 `ApiResponse`。
- Produces: `GET /api/cost/summary`、`GET /api/cost/analysis`（契约见上文「跨仓接口契约」）。

- [ ] **Step 1: 创建 `CostController.java`**

```java
package com.library.cost.controller;

import com.library.cost.common.ApiResponse;
import com.library.cost.dto.AnalysisQuery;
import com.library.cost.dto.AnalysisResponse;
import com.library.cost.dto.CostSummaryDTO;
import com.library.cost.service.CostService;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/cost")
public class CostController {

    private final CostService costService;

    public CostController(CostService costService) {
        this.costService = costService;
    }

    @GetMapping("/summary")
    public ApiResponse<CostSummaryDTO> summary(@RequestParam(defaultValue = "") String year) {
        return ApiResponse.ok(costService.summary(year));
    }

    @GetMapping("/analysis")
    public ApiResponse<AnalysisResponse> analysis(AnalysisQuery query) {
        return ApiResponse.ok(costService.analysis(query));
    }
}
```

- [ ] **Step 2: 编写集成测试 `CostApiIntegrationTest.java`**

```java
package com.library.cost;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class CostApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @Test
    void summaryReturnsSeedBasedTotals() throws Exception {
        String body = mockMvc.perform(get("/api/cost/summary").param("year", "2025"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andReturn().getResponse().getContentAsString();

        JsonNode data = objectMapper.readTree(body).path("data");
        assertThat(data.path("totalCost").decimalValue()).isEqualByComparingTo("2004000.00");
        assertThat(data.path("laborCost").decimalValue()).isEqualByComparingTo("414000.00");
        assertThat(data.path("projectCost").decimalValue()).isEqualByComparingTo("1590000.00");
        assertThat(data.path("laborRatio").doubleValue()).isEqualTo(20.66);
        assertThat(data.path("projectRatio").doubleValue()).isEqualTo(79.34);
        assertThat(data.path("overBudgetCount").asInt()).isEqualTo(1);
        assertThat(data.path("monthlyTrend")).hasSize(6);
    }

    @Test
    void analysisProjectDimensionShowsOverBudgetProject() throws Exception {
        String body = mockMvc.perform(get("/api/cost/analysis")
                        .param("dimension", "project")
                        .param("year", "2025"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andReturn().getResponse().getContentAsString();

        JsonNode records = objectMapper.readTree(body).path("data").path("records");
        assertThat(records).hasSize(4);
        JsonNode dataPlatform = null;
        for (JsonNode r : records) {
            if ("数据中台".equals(r.path("name").asText())) {
                dataPlatform = r;
            }
        }
        assertThat(dataPlatform).isNotNull();
        assertThat(dataPlatform.path("budgetRatio").doubleValue()).isEqualTo(120.00);
        assertThat(dataPlatform.path("overBudgetAmount").decimalValue())
                .isEqualByComparingTo("80000.00");
    }

    @Test
    void analysisDepartmentDimensionGroupsByDepartment() throws Exception {
        String body = mockMvc.perform(get("/api/cost/analysis")
                        .param("dimension", "department")
                        .param("year", "2025"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.code").value(0))
                .andReturn().getResponse().getContentAsString();

        JsonNode records = objectMapper.readTree(body).path("data").path("records");
        assertThat(records).hasSize(2);
        assertThat(records.get(0).path("name").asText()).isEqualTo("研发部");
        assertThat(records.get(0).path("laborCost").decimalValue())
                .isEqualByComparingTo("306000.00");
        assertThat(records.get(0).path("budgetRatio").doubleValue()).isEqualTo(71.67);
    }

    @Test
    void analysisRejectsInvalidDimension() throws Exception {
        mockMvc.perform(get("/api/cost/analysis")
                        .param("dimension", "unknown")
                        .param("year", "2025"))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.code").value(400));
    }

    @Test
    void analysisQuarterFilterWorks() throws Exception {
        String body = mockMvc.perform(get("/api/cost/analysis")
                        .param("dimension", "quarter")
                        .param("year", "2025"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString();

        JsonNode records = objectMapper.readTree(body).path("data").path("records");
        assertThat(records).hasSize(2);
        assertThat(records.get(0).path("name").asText()).isEqualTo("2025-Q1");
        assertThat(records.get(0).path("projectActual").decimalValue())
                .isEqualByComparingTo("795000.00");
    }
}
```

> 说明：`records.get(0)` 依赖实现中的排序（laborCost 降序）。2025-Q1 与 2025-Q2 人力成本均为 207000.00，`thenComparing(name)` 使 "2025-Q1" < "2025-Q2"（字典序），故 get(0) 为 Q1；断言据此编写。

- [ ] **Step 3: 运行测试**

Run: `cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main && mvn -q test`
Expected: `BUILD SUCCESS`；`CostApiIntegrationTest` 5 项全过。

- [ ] **Step 4: Commit**

```bash
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main
git add src/main/java/com/library/cost/controller/CostController.java src/test/java/com/library/cost/CostApiIntegrationTest.java
git commit -m "feat: 提供成本总览与统计分析接口及集成测试

Co-authored-by: DTCoder <noreply@dtcoder.local>"
```

