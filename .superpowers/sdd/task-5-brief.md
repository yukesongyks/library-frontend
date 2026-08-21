### Task 5: 报表导出接口（Excel / CSV）

**Files:**
- Create: `library-backend/src/main/java/com/library/cost/exporter/CostExporter.java`
- Modify: `library-backend/src/main/java/com/library/cost/controller/CostController.java`（追加 `export` 端点）
- Test: `library-backend/src/test/java/com/library/cost/ExportApiIntegrationTest.java`

**Interfaces:**
- Consumes: Task 3 的 `CostService.queryItems(AnalysisQuery)` 与 `CostAnalysisItem`；Task 4 的 `CostController`。
- Produces: `GET /api/cost/export?dimension=...&format=xlsx|csv`（文件流，见契约表）。

- [ ] **Step 1: 创建 `CostExporter.java`**

```java
package com.library.cost.exporter;

import com.library.cost.dto.CostAnalysisItem;
import org.apache.poi.ss.usermodel.Row;
import org.apache.poi.ss.usermodel.Sheet;
import org.apache.poi.ss.usermodel.Workbook;
import org.apache.poi.xssf.usermodel.XSSFWorkbook;
import org.springframework.stereotype.Component;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.List;

@Component
public class CostExporter {

    private static final String[] HEADERS = {"名称", "人力成本", "项目预算", "实际消耗", "预算占比", "预计超支金额"};

    public byte[] toXlsx(List<CostAnalysisItem> items) throws IOException {
        try (Workbook workbook = new XSSFWorkbook();
             ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            Sheet sheet = workbook.createSheet("成本统计报表");
            Row header = sheet.createRow(0);
            for (int i = 0; i < HEADERS.length; i++) {
                header.createCell(i).setCellValue(HEADERS[i]);
            }
            int r = 1;
            for (CostAnalysisItem it : items) {
                Row row = sheet.createRow(r++);
                row.createCell(0).setCellValue(it.name());
                row.createCell(1).setCellValue(it.laborCost().doubleValue());
                row.createCell(2).setCellValue(it.projectBudget().doubleValue());
                row.createCell(3).setCellValue(it.projectActual().doubleValue());
                row.createCell(4).setCellValue(it.budgetRatio());
                row.createCell(5).setCellValue(it.overBudgetAmount().doubleValue());
            }
            for (int i = 0; i < HEADERS.length; i++) {
                sheet.autoSizeColumn(i);
            }
            workbook.write(out);
            return out.toByteArray();
        }
    }

    public byte[] toCsv(List<CostAnalysisItem> items) {
        StringBuilder sb = new StringBuilder(String.join(",", HEADERS)).append("\r\n");
        for (CostAnalysisItem it : items) {
            sb.append(csv(it.name())).append(',')
              .append(it.laborCost()).append(',')
              .append(it.projectBudget()).append(',')
              .append(it.projectActual()).append(',')
              .append(String.format("%.2f", it.budgetRatio())).append(',')
              .append(it.overBudgetAmount()).append("\r\n");
        }
        return sb.toString().getBytes(StandardCharsets.UTF_8);
    }

    private String csv(String value) {
        if (value == null) {
            return "\"\"";
        }
        if (value.contains(",") || value.contains("\"") || value.contains("\n")) {
            return "\"" + value.replace("\"", "\"\"") + "\"";
        }
        return value;
    }
}
```

- [ ] **Step 2: 改写 `CostController.java`（追加 export 端点，整体内容如下）**

```java
package com.library.cost.controller;

import com.library.cost.common.ApiResponse;
import com.library.cost.dto.AnalysisQuery;
import com.library.cost.dto.AnalysisResponse;
import com.library.cost.dto.CostAnalysisItem;
import com.library.cost.dto.CostSummaryDTO;
import com.library.cost.exporter.CostExporter;
import com.library.cost.service.CostService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.io.IOException;
import java.util.List;

@RestController
@RequestMapping("/api/cost")
public class CostController {

    private final CostService costService;
    private final CostExporter costExporter;

    public CostController(CostService costService, CostExporter costExporter) {
        this.costService = costService;
        this.costExporter = costExporter;
    }

    @GetMapping("/summary")
    public ApiResponse<CostSummaryDTO> summary(@RequestParam(defaultValue = "") String year) {
        return ApiResponse.ok(costService.summary(year));
    }

    @GetMapping("/analysis")
    public ApiResponse<AnalysisResponse> analysis(AnalysisQuery query) {
        return ApiResponse.ok(costService.analysis(query));
    }

    @GetMapping("/export")
    public ResponseEntity<byte[]> export(AnalysisQuery query,
                                         @RequestParam(defaultValue = "xlsx") String format) throws IOException {
        List<CostAnalysisItem> items = costService.queryItems(query);
        String ext = "csv".equalsIgnoreCase(format) ? "csv" : "xlsx";
        String year = (query.getYear() == null || query.getYear().isBlank()) ? "all" : query.getYear();

        byte[] body;
        String contentType;
        if ("csv".equalsIgnoreCase(format)) {
            body = costExporter.toCsv(items);
            contentType = "text/csv;charset=UTF-8";
        } else {
            body = costExporter.toXlsx(items);
            contentType = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
        }
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"cost-report-" + year + "." + ext + "\"")
                .contentType(MediaType.parseMediaType(contentType))
                .body(body);
    }
}
```

> 说明：Task 4 创建的 controller 仅含 summary/analysis 并只注入 `CostService`；本任务需同步新增 `costExporter` 字段与构造参数。

- [ ] **Step 3: 编写导出集成测试 `ExportApiIntegrationTest.java`**

```java
package com.library.cost;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ExportApiIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void exportCsvContainsHeaderAndRows() throws Exception {
        String body = mockMvc.perform(get("/api/cost/export")
                        .param("dimension", "department")
                        .param("year", "2025")
                        .param("format", "csv"))
                .andExpect(status().isOk())
                .andExpect(content().contentType("text/csv;charset=UTF-8"))
                .andReturn().getResponse().getContentAsString();

        assertThat(body).startsWith("名称,");
        assertThat(body).contains("研发部");
        assertThat(body).contains("306000.00");
    }

    @Test
    void exportXlsxReturnsSpreadsheetBytes() throws Exception {
        byte[] bytes = mockMvc.perform(get("/api/cost/export")
                        .param("dimension", "project")
                        .param("year", "2025")
                        .param("format", "xlsx"))
                .andExpect(status().isOk())
                .andExpect(content().contentType(MediaType.parseMediaType(
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")))
                .andReturn().getResponse().getContentAsByteArray();

        assertThat(bytes.length).isGreaterThan(1000);
    }
}
```

- [ ] **Step 4: 运行测试**

Run: `cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main && mvn -q test`
Expected: `BUILD SUCCESS`；`ExportApiIntegrationTest` 2 项全过（同时确保 Task 1-4 旧测试仍全过，回归为 13 项）。

- [ ] **Step 5: Commit**

```bash
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main
git add src/main/java/com/library/cost/controller/CostController.java src/main/java/com/library/cost/exporter src/test/java/com/library/cost/ExportApiIntegrationTest.java
git commit -m "feat: 支持成本报表 Excel/CSV 导出

Co-authored-by: DTCoder <noreply@dtcoder.local>"
```

---

## 前端任务（library-frontend）

