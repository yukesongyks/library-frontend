# Task 3 Report: 统计服务（聚合引擎）— Cost Statistical Aggregation Engine

**Status: DONE** — all 11 brief files written verbatim (byte-for-byte diffed against the brief), `mvn -q test` → BUILD SUCCESS, 6/6 tests pass across 3 classes.

## Files written (all per brief, in `library-backend-main`)

Main (`src/main/java/com/library/cost/`):
- `dto/LaborCostRow.java` — record (projectId, month, amount, role, departmentId, businessLineId, employeeId)
- `dto/ProjectCostRow.java` — record (projectId, month, actualAmount, departmentId, businessLineId, budgetAmount)
- `dto/MonthlyTrendItem.java` — record (month, laborCost, projectCost, totalCost)
- `dto/CostSummaryDTO.java` — record (totalCost, laborCost, projectCost, laborRatio, projectRatio, overBudgetCount, monthlyTrend)
- `dto/CostAnalysisItem.java` — record (name, laborCost, projectBudget, projectActual, budgetRatio, overBudgetAmount)
- `dto/AnalysisResponse.java` — record (records, total)
- `dto/AnalysisQuery.java` — Lombok @Data class (dimension, year, month, quarter, role)
- `mapper/CostReportMapper.java` — `@Mapper` with two `@Select` text-block queries: `selectLaborRows(year)` (labor_cost ⋈ employee ⋈ project, `<year>%` month filter, snake→camel aliases) and `selectProjectCostRows(year)` (project_cost ⋈ project)
- `service/CostService.java` — interface: `summary(year)`, `analysis(AnalysisQuery)`, `queryItems(AnalysisQuery)`
- `service/CostServiceImpl.java` — @Service core aggregation: dimension-key grouping in Java (LinkedHashMap), per-key budget dedup via `key#projectId` set, metric rules per plan (labor=sum amount per dim key; project budget=year total budget each project counted once per key; actual=sum; budgetRatio=÷×100 scaled 2dp HALF_UP, 0→0.0; overBudget=actual−budget; quarter key `YYYY-Qn`; role filter scopes both labor rows and employee-dimension project keys via project→employee mapping; entity dims department/project/business_line/employee + time dims month/quarter/year; DECIMAL arithmetic via BigDecimal)

Test:
- `src/test/java/com/library/cost/CostServiceImplTest.java` — 4 unit tests (mocked mappers, brief's own assertion values): summaryAggregatesTotalsAndTrend, departmentDimensionGroupsByDepartment, roleFilterRestrictsLaborRows, invalidDimensionRejected

## Verification

Command: `cd .../worktree/library-backend-main && mvn -q test` (Java 17, Spring Boot 3.2.5, MyBatis-Plus 3.5.5, deps cached)

Result: exit code 0, BUILD SUCCESS in ~19.6s. Surefire per-class outcomes:
- `com.library.cost.CostApplicationTests` — Tests run: 1, Failures: 0, Errors: 0
- `com.library.cost.SeedDataMapperTest` — Tests run: 1, Failures: 0, Errors: 0
- `com.library.cost.CostServiceImplTest` — Tests run: 4, Failures: 0, Errors: 0 (new)

Total 6 tests, 0 failures/errors.

Static review: script extracted all 11 ` ```java ` code blocks from `task-3-brief.md` and diffed each against the corresponding on-disk file → **NONE mismatch (byte-for-byte identical)**.

## Deviations / notes

1. **Commit step SKIPPED** per hard constraint (GIT READ-ONLY). No git write command was run; the only git command used was read-only `git status --short` → shows only untracked (`??`) entries, **no `M` (modified) entries**, confirming no Task-1/2 files (schema.sql / data.sql / entities / mappers / application.yml / pom.xml) were touched.
2. **One-time path incident (self-corrected)**: an initial patch resolved relative paths from the worktree root, so the 11 files were briefly created under `worktree/src/...` instead of `worktree/library-backend-main/src/...`; a first `mvn -q test` consequently compiled nothing new (exit 0, only 2 old test classes ran). Files were moved to the correct backend root, the misplaced copies (created by me) were removed, and `mvn -q test` was rerun once — this rerun is the authoritative verification above. No code content changed during the move.
3. No pom.xml changes and no extra files/dependencies added.

## Concerns / follow-up

- **Mapper SQL not exercised**: `CostServiceImplTest` mocks `CostReportMapper` per the brief, so the two `@Select` queries (aliases, `CONCAT(#{year},'%')`, H2 `NON_KEYWORDS MONTH` interplay) are not validated by any test yet. Real-DB integration coverage should come from the Task 4 controller/API tests against the seeded H2.
- **Brief's test uses its own mock data** (labor 55000, project actual 100000, budget 1000000), NOT the seed baselines (labor 414000 / project 1590000) — this is per the brief's own Step 6 code and the Task-2 seed-window note; no seed-value assertions exist in this task.
- Interest: `CostServiceImpl` uses `java.time.LocalDate.now()` for null year — in tests year is always passed explicitly.
- `target/` (build artifacts including surefire reports) is generated and untracked; left as-is.