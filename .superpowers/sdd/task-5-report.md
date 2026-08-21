# Task 5 Report: 报表导出接口（Excel / CSV）

Status: **DONE** — all files written verbatim per brief; full test suite green.

## Files written (all relative to `library-backend-main/`)

| File | Action | Notes |
|---|---|---|
| `src/main/java/com/library/cost/exporter/CostExporter.java` | Created | `@Component`; `toXlsx(...)` via Apache POI `XSSFWorkbook` (sheet 成本统计报表, headers 名称/人力成本/项目预算/实际消耗/预算占比/预计超支金额, numeric cells via `.doubleValue()`, `autoSizeColumn`), `toCsv(...)` with `String.format("%.2f", budgetRatio)` (预算占比 2 位小数), CRLF line endings, UTF-8 bytes, `csv(...)` quoting helper |
| `src/main/java/com/library/cost/controller/CostController.java` | Rewritten | Task 4 controller (summary/analysis, single `CostService` injection) extended per brief: added `CostExporter` field + constructor param, and `GET /api/cost/export?dimension=...&format=xlsx\|csv` returning `ResponseEntity<byte[]>` with `Content-Disposition: attachment; filename="cost-report-<year>.<ext>"` (year blank → `all`), content types `text/csv;charset=UTF-8` / `application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`. Summary/analysis endpoints unchanged |
| `src/test/java/com/library/cost/ExportApiIntegrationTest.java` | Created | `@SpringBootTest` + `@AutoConfigureMockMvc`; 2 tests as specified in brief |

## Verification

Command (run once, per brief):
```
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main && mvn -q test
```
Result: exit code 0 (command backgrounded by runtime, completed in ~26s). Per-class outcomes from `target/surefire-reports/*.txt`:

| Test class | Tests run | Failures | Errors | Skipped |
|---|---|---|---|---|
| CostApiIntegrationTest | 10 | 0 | 0 | 0 |
| CostServiceImplTest | 4 | 0 | 0 | 0 |
| SeedDataMapperTest | 1 | 0 | 0 | 0 |
| CostApplicationTests | 1 | 0 | 0 | 0 |
| **ExportApiIntegrationTest (new)** | **2** | 0 | 0 | 0 |
| **Total** | **18** | 0 | 0 | 0 |

- All 16 prior tests (Tasks 1–4) still pass; 2 new export tests pass (CSV header/row/content assertions incl. `306000.00`; xlsx byte length > 1000).
- `grep -l -E "FAILURE|ERROR"` over surefire reports: none.

## Verbatim-fidelity check

Byte-level comparison of each written file against the brief's code blocks (extracted from `task-5-brief.md`):
- `CostExporter.java` → VERBATIM MATCH
- `CostController.java` → VERBATIM MATCH
- `ExportApiIntegrationTest.java` → VERBATIM MATCH

(Only tolerated difference: written files omit the trailing newline after the final `}`; content otherwise byte-identical.)

## Deviations

- None in code. Hard-constraint #1 honored: **no git commands run** (brief Step 5 Commit skipped as instructed; `.git/README/pom.xml/application.yml` untouched).

## Concerns / notes

- Per brief contract, amounts in the export reuse the values from the analysis computation (CSV cells for 人力成本/项目预算/实际消耗/预计超支金额 are emitted as-is via `BigDecimal.toString()`, e.g. `306000.00`); 预算占比 is rounded to 2 decimals in CSV. The task description mentions "金额保留 2 位小数" — the brief's verbatim code formats only `budgetRatio` to 2 decimals; I implemented exactly the brief's code rather than inventing rounding, to honor the "files exactly per brief" constraint. If the product expects all money columns rounded to 2 decimals, that is a potential follow-up (would deviate from the brief's verbatim code).
- Test class count note: brief text mentions "回归为 13 项", but the actual suite has 16 prior tests (parent context counts 16/16 green); total after Task 5 is 18 tests, all green.

Report path: `/root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-frontend-main/.superpowers/sdd/task-5-report.md`