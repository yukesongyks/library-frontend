# Task 4 Report: 总览与统计分析接口 (Summary & Analysis REST Endpoints)

**Status: DONE**
**Date:** 2026-08-21

## Summary

Created `CostController` (GET `/api/cost/summary`, GET `/api/cost/analysis`) and the
`CostApiIntegrationTest` MockMvc integration test suite running against the REAL H2 DB
(MODE=MySQL, `SET NON_KEYWORDS MONTH;`) with Task 1-3 seed data. `mvn -q test` → **BUILD SUCCESS**, 16/16 tests pass
(10 in the new integration test, 4 service unit tests, 1 seed mapper test, 1 context test).

## Files written

| File | Kind | Notes |
|---|---|---|
| `library-backend-main/src/main/java/com/library/cost/controller/CostController.java` | new | Byte-verbatim from task-4-brief.md Step 1: `@RestController @RequestMapping("/api/cost")`, `summary(@RequestParam(defaultValue="") String year)` → `ApiResponse.ok(costService.summary(year))`, `analysis(AnalysisQuery query)` → `ApiResponse.ok(costService.analysis(query))`. Compiles against Task 3 `CostService` and Task 1 `ApiResponse` with zero changes to those files. |
| `library-backend-main/src/test/java/com/library/cost/CostApiIntegrationTest.java` | new | Brief's 5 tests verbatim (assertions unchanged) + 5 additional tests added to satisfy Task-3 reviewer coverage requirements (see below). |

No other files touched. No dependency changes (JdbcTemplate/spring-tx already on classpath via mybatis-plus-spring-boot3-starter / spring-boot-starter).
Git commit step **SKIPPED** per hard constraint (GIT READ-ONLY) — brief's Step 4 not executed.

## Verification

Command (run as specified, once, plus the single allowed rerun after the smallest root-cause fix):

```
cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main && mvn -q test
```

Result: **BUILD SUCCESS** (~22 s). Per-class outcomes (surefire reports):

| Test class | Run | Failures | Errors | Notes |
|---|---|---|---|---|
| `CostApiIntegrationTest` | 10 | 0 | 0 | new integration tests |
| `CostServiceImplTest` | 4 | 0 | 0 | Task 3 unit tests unaffected |
| `SeedDataMapperTest` | 1 | 0 | 0 | Task 2 seed baseline (labor 414000.00 / 24 rows, project_cost 1590000.00 / 24 rows) |
| `CostApplicationTests` | 1 | 0 | 0 | context loads |
| **Total** | **16** | **0** | **0** | |

Note: repo currently contains 4 test classes (not 5); 16 tests total.

### CostApiIntegrationTest cases (all pass)

Brief-verbatim tests:
1. `summaryReturnsSeedBasedTotals` — `/api/cost/summary?year=2025`: code=0, totalCost=2004000.00, laborCost=414000.00, projectCost=1590000.00, laborRatio=20.66, projectRatio=79.34, overBudgetCount=1, monthlyTrend size 6.
2. `analysisProjectDimensionShowsOverBudgetProject` — 4 project records; 数据中台 budgetRatio=120.00, overBudgetAmount=+80000.00 (overrun positive; real seed: budget 400000, actual 480000).
3. `analysisDepartmentDimensionGroupsByDepartment` — 2 records; 研发部 laborCost=306000.00, budgetRatio=71.67 (排序: laborCost 降序).
4. `analysisRejectsInvalidDimension` — `dimension=unknown` → HTTP 400, code=400 (IllegalArgumentException → GlobalExceptionHandler).
5. `analysisQuarterFilterWorks` — `dimension=quarter&year=2025` → 2 records, `2025-Q1` projectActual=795000.00.

Reviewer-required coverage added:
6. `analysisEmployeeDimensionRoleFilterExcludesOthers` — `dimension=employee&year=2025&role=TEST`: exactly 1 record (李四, TEST), laborCost=90000.00; 张三/王五/赵六 absent (other-role employees filtered out).
7. `analysisZeroBudgetProjectRatioGuard` — `@Transactional` runtime insert of a budget-0 project (`零预算项目`, budget 0) with actual 50000.00 on 2025-06 → record: projectBudget=0, projectActual=50000.00, budgetRatio=0.0 (guard, no Infinity/NaN), overBudgetAmount=+50000.00 (overrun positive). Transaction rolls back; seed untouched for other tests.
8. `analysisBudgetDedupedInMonthQuarterYearDims` — budget summed once per project across month (`2025-01` → 2400000.00 / 265000.00), quarter (`2025-Q1` → 2400000.00 / 795000.00) and year (`2025` → 2400000.00 / 1590000.00); would be 6× over-counted in year dim without budget dedupe (project-budget per-key dedupe by `key#projectId` in CostServiceImpl).
9. `analysisYearDimensionReturnsSingleYyyyRecord` — `dimension=year` → total=1, single record named `2025`, laborCost=414000.00, projectActual=1590000.00 (`YYYY` key shape).
10. `analysisBusinessLineDimensionGroups` — 2 records using `.path("name")`: 金融科技线 laborCost=210000.00, projectActual=1080000.00, projectBudget=1400000.00; 数字企业线 204000.00 / 510000.00 / 1000000.00.

All extra assertions derived from real `data.sql` baselines, not invented values.

## Deviations & findings

1. **UTF-8 decode fix (only fix needed).** First `mvn -q test` run: 5 failures in `CostApiIntegrationTest`, all symptom `expected: "研发部" but was: "ç åé¨"` (and `recordByName` null for Chinese names). Root cause isolated by comparing passing `CostServiceImplTest` (asserts 研发部 via service layer, passes) → DB/MyBatis/Jackson pipeline is fine; corruption happens solely in `MockHttpServletResponse.getContentAsString()`, which defaults to ISO-8859-1 and mis-decodes the UTF-8 JSON body. Smallest root-cause fix: added a `decode(ResultActions)` helper that reads `getContentAsByteArray()` and decodes with `StandardCharsets.UTF_8` (all `getContentAsString()` call sites replaced with `decode(...)`; assertions untouched). This is a test-side fix; no server config/files modified. Rerun once → BUILD SUCCESS. If the plan expects strict verbatim equality of the brief test file, note this single deviation (brief's own Chinese-name assertions could not pass in this runtime otherwise).
2. **Seed-baseline discrepancy in the briefing:** the delegation email states seed budgets "400000/300000/450000/440000=1590000", but the actual reviewed `data.sql` (Task 2) contains project budgets **1000000 / 400000 / 600000 / 400000 = 2400000** (P1 核心交易系统, P2 数据中台, P3 客户门户, P4 运维支撑平台). The brief's own verbatim assertions (数据中台 120.00%, +80000.00) only match the real data.sql (P2 budget 400000, actual 480000), so the planning text appears to be a stale draft. All assertions/values in the test use the REAL seed (data.sql), and per-project budget sums (departments/lines/times) were computed from data.sql actuals.
3. **Test file extended beyond brief verbatim** (5 brief tests kept as-is + 5 added) to satisfy the binding Task-3 reviewer upgrade-coverage requirements (role filter, 0-budget guard, budget dedupe, quarter/year keys, business_line dim, overrun sign). Brief's 5 tests alone would not cover them; only the two brief-designated files were touched (no extra files/deps).
4. **0-budget guard coverage needed a 0-budget row**, which doesn't exist in seed; inserted one at test runtime inside a `@Transactional` method (auto-rolled-back), exercising the guard in `CostServiceImpl.ratio()` (`whole == 0 → 0.0`) via the real endpoint + real mapper SQL. No file/seed changes.
5. Git: no `git` writes executed; `.git/`, existing sources, `data.sql`, `schema.sql`, `application.yml` untouched.

## Left undone / follow-up

- Nothing functional left; commit of the two files is intentionally SKIPPED (GIT READ-ONLY) and must be performed by the parent/orchestrator with the brief's message (including the Co-authored-by trailer).
- If the plan owner wants the integration test to stay byte-identical to the brief, they must accept dropping Chinese-name assertions or changing `MockHttpServletResponse` charset handling project-wide — current test is the minimal adjusted version that passes in this runtime.