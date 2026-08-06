# Code Review Report

## 评审概要

| 项目 | 值 |
|------|-----|
| 任务ID | DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-85e0e0bc-ef1f-4906-9d3a-cbc79cb54e0a |
| 评审阶段 | review |
| 评审技能 | dtazziboot-java-code-review (降级执行) |
| 变更语言 | TypeScript / Markdown |
| Blocker数 | 2 |
| Major数 | 2 |
| Minor数 | 1 |

> ⚠️ **降级说明**：本次变更不包含任何 `.java` 文件，`dtazziboot-java-code-review` 技能的 Java SDD 审查流程不适用。已降级为基于设计文档与代码实现的契约一致性静态审查。

---

## Blocker 问题清单

### B-01: 导出接口 HTTP Method 与入参契约与设计文档严重不一致

- **文件**: `[library-backend] src/routes/exportRoute.ts` L28-L31
- **设计契约**: `POST /api/export`，Request Body `{ tab: string, dataRows: Record<string,unknown>[] }`
- **实际实现**: `GET /export`，Query Parameters `?tab=...&format=...`
- **影响**: 前端按设计文档调用 POST + Body 将收到 404/405；即使改为 GET，也无法传递 `dataRows`，导致导出功能完全不可用。
- **修复建议**: 将路由改为 `exportRoute.post("/export", ...)`，从 `req.body` 解构 `{ tab, dataRows }`，移除 `buildDataRows()` 硬编码逻辑，直接使用前端传入的 `dataRows`。

### B-02: 导出数据源逻辑错误，忽略用户实际执行结果

- **文件**: `[library-backend] src/routes/exportRoute.ts` L11-L26
- **问题**: `buildDataRows()` 函数对每个 tab 返回硬编码默认值（hash 用空字符串、bubble-sort 用空数组），完全丢弃前端传入的用户执行结果。
- **影响**: 导出的 Excel 永远是空数据或默认数据，不符合需求"导出各个页面的展示结果"。
- **修复建议**: 删除 `buildDataRows()`，直接使用请求体中的 `dataRows` 参数作为导出数据来源。

---

## Major 问题清单

### M-01: 导出接口参数校验错误码与设计不一致

- **文件**: `[library-backend] src/routes/exportRoute.ts` L34, L39
- **设计约定**: §4.1 参数校验失败统一返回 `422`
- **实际实现**: invalid tab/format 返回 `400`
- **修复建议**: 将 `res.status(400).json(fail(400, ...))` 改为 `res.status(422).json(fail(422, ...))`，保持异常分层一致。

### M-02: Content-Disposition 文件名未按设计承诺转义

- **文件**: `[library-backend] src/routes/exportRoute.ts` L58
- **设计承诺**: §4.3 "导出文件名特殊字符转义 ✅ 已处理"
- **实际实现**: 直接模板字符串拼接 `` `attachment; filename=${tab}.xlsx` ``，无转义逻辑
- **风险**: 当前 VALID_TABS 白名单暂时安全，但违反设计承诺；未来扩展含 `-` 以外字符时可能触发 Header 解析异常。
- **修复建议**: 添加文件名清理函数，确保仅保留 `[a-z0-9-]` 并对非法字符替换为 `_`，或使用 RFC 5987 编码格式。

---

## Minor 问题清单

### m-01: bubbleSortRoute 缺少显式 try-catch

- **文件**: `[library-backend] src/routes/bubbleSortRoute.ts` L24
- **说明**: 设计文档 §4.1 描述业务逻辑异常由 try-catch + errorMiddleware 覆盖，当前代码直接调用 `bubbleSort()` 无局部捕获。虽有全局 error middleware 兜底，但与文档描述的显式分层不完全一致。
- **建议**: 补充 try-catch 包裹排序调用，或在设计文档中明确标注"依赖全局 error middleware"。

---

## 跨仓对齐检查

| 对齐项 | 设计文档 | 后端实现 | 状态 |
|--------|----------|----------|------|
| helloworld 接口 | GET `/api/helloworld` | 未在变更文件中体现（存量） | ⏭️ 未审查 |
| hash 接口 | POST `/api/hash` | 未在变更文件中体现（存量） | ⏭️ 未审查 |
| bubble-sort 接口 | POST `/api/bubble-sort` | ✅ 一致 | ✅ |
| export 接口 | POST `/api/export` + Body | ❌ GET + Query | ❌ **B-01** |
| 导出数据源 | 前端传 dataRows | ❌ 后端硬编码 | ❌ **B-02** |
| 错误码规范 | 422 | ⚠️ 混用 400/422 | ⚠️ **M-01** |
| 文件名转义 | 已处理 | ❌ 未处理 | ❌ **M-02** |

---

## 结论

本次变更存在 **2 个 Blocker**，导出接口与设计文档存在根本性契约冲突，**不具备合并条件**。需优先修复 B-01、B-02 后重新提交评审。
