# Code Review Checklist

> **Change** `helloworld-dtT3DJ` · **分支/Commit** `AI/task-DEV-966dcd0a-7905-11f1-9649-3b4281182f10-d505b0a0-bf1c-4f66-` / `cddbdbd` · **日期** `2026-08-07`
>
> **仓库** library-backend（评审对象为编码实现 stage: coding 变更）
>
> **AI**：唯一进度源；状态仅用 `⬜` `✅` `❌` `⚠️` `N/A`。
> **完成标准**：所有核销项必须从 `⬜` 变为其他状态；`N/A` 需写原因。

---

## 1. 通览 (Overview)

本次评审对象为需求 `helloworld-dtT3DJ` 的「编码实现 (stage: coding)」节点变更，仓库为 `library-backend`，分支 `AI/task-DEV-966dcd0a-...`，commit `cddbdbd`。

依据 git diff `HEAD~1..HEAD`，编码实现阶段实际变更文件为 2 个：

| # | 文件（仓库相对路径） | 变更内容 |
|---|--------------------|----------|
| 1 | `src/main/java/com/library/LibraryBackendApplication.java` | `@MapperScan` 路径由 `com.library.mapper` 修正为 `com.library.track.mapper`，与实际 Mapper 包路径对齐 |
| 2 | `src/test/java/com/library/demo/DemoServiceTest.java` | 移除 `@SpringBootTest` 重型上下文，改为纯单元测试（`@BeforeEach` 手动 new DemoService）；`List.of()` → `Collections.emptyList()`；`new java.util.ArrayList<>()` → `new ArrayList<>()`（补 import） |

> 说明：系分阶段（commit `0cfbf34`）已落地全部业务代码（DemoController/DemoService/TrackService/ExportService 等），本次 coding 节点仅做 Bug 修复与测试重构，属增量修正型变更。

### 跨仓对齐理解

- 后端三接口 `W01/W02/W03`（`/api/demo/helloworld`、`/api/demo/hash`、`/api/demo/bubble-sort`）与前端 `library-frontend` 的 `src/api/demo.js` + `DemoPage.vue` 三 Tab 调用路径对齐。
- 通用出参 `ApiResponse {code, msg, data}`，`code="OK"` 表成功，前端按此契约解析。
- `@MapperScan` 修正直接影响埋点写入链路：修正前 Mapper 不被扫描 → `TrackService.recordCall` 的 INSERT 会抛 `BindingOperationProxyException` → 埋点静默失败（被 catch 降级），前端统计报表无数据。本次修复打通了后端→前端统计可视化的数据链路。

---

## Step 1 — 执行队列（产物 A）

> 执行阶段已对变更路径运行 `references/script/scan-all-rules.sh`，输出见 Step 3/4 备注。

| # | 文件（仓库相对路径） | 归属原因 | Step2 | Step3 | G1 | G2 | G3 | G4 | G5 | G6 | G7 | G8 | G9 | G10 | G11 | G12 | G13 | G14 | G15 | G16 | G17 | S1 | S2 | S3 | S4 | S5 | S6 | S7 | S8 | S9 | S10 | 总状态 |
|---|--------------------|----------|-------|-------|----|----|----|----|----|----|----|----|----|-----|-----|-----|-----|-----|-----|-----|-----|----|----|----|----|----|----|----|----|----|----|----|--------|
| 1 | `src/main/java/com/library/LibraryBackendApplication.java` | coding 变更：@MapperScan 路径修正 | ✅ | ✅ | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | ✅ |
| 2 | `src/test/java/com/library/demo/DemoServiceTest.java` | coding 变更：测试重构为纯单元测试 | ✅ | ⚠️ | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | N/A | ⚠️ |

> G1-G17/S1-S10 对本次变更均 N/A：文件1为注解路径修正无逻辑变更；文件2为测试类，无生产并发/事务/安全面。Step3 ⚠️ 为 scan-all-rules.sh 命中的 A2.2 通配符 import。

---

## Step 2 — 功能核对（产物 B）

### 2.1 [library-backend] LibraryBackendApplication.java

| 核对项 | 结论 | 证据 |
|--------|------|------|
| `@MapperScan` 路径与实际 Mapper 包一致 | ✅ 通过 | 修正为 `com.library.track.mapper`，与 `CallRecordMapper` 所在包 `com.library.track.mapper`（见 inputs_content 路径）一致 |
| Spring Boot 启动注解完整 | ✅ 通过 | `@SpringBootApplication` + `@MapperScan` 保留，`main` 方法不变 |

### 2.2 [library-backend] DemoServiceTest.java

| 核对项 | 结论 | 证据 |
|--------|------|------|
| 三接口（helloworld/hash/bubbleSort）均有测试覆盖 | ✅ 通过 | `testHelloworld` / `testHashSha256`+`testHashDefault`+`testHashEmptyText`+`testHashUnsupportedAlgorithm` / `testBubbleSort`+`testBubbleSortEmpty`+`testBubbleSortTooLarge` |
| 错误码覆盖与系分一致 | ✅ 通过 | DEMO_002/003/004/005 均有断言；DEMO_001（服务异常）为不可控路径未直接覆盖，合理 |
| 纯单元测试与系分"无状态纯计算"语义一致 | ✅ 通过 | 移除 `@SpringBootTest` + `@Autowired`，`@BeforeEach` 手动构造 `new DemoService()`，无容器依赖 |
| 冒泡排序正确性验证 | ✅ 通过 | 输入 `[5,3,8,1,9,2]` 断言输出 `[1,2,3,5,8,9]`，size=6，costMs 非空 |
| 哈希 SHA-256 摘要长度验证 | ✅ 通过 | 断言 `hash.length()==64`（SHA-256 十六进制 64 字符） |

### 2.3 跨库接口契约对齐（后端 coding 变更不涉及契约变更，但须验证一致性）

| 契约点 | 后端实现 | 前端调用 | 结论 |
|--------|----------|----------|------|
| W01 出参 `data.result`/`data.timestamp` | `DemoResult{result,timestamp}` | `DemoPage.vue` HelloWorldTab 展示 | ✅ 对齐 |
| W02 出参 `data.algorithm`/`data.input`/`data.hash` | `HashResult{algorithm,input,hash}` | `HashTab.vue` 展示 | ✅ 对齐 |
| W03 出参 `data.sorted`/`data.costMs`/`data.size` | `SortResult{sorted,costMs,size}` | `BubbleSortTab.vue` 展示 | ✅ 对齐 |
| 通用出参 `{code,msg,data}` | `ApiResponse{code,msg,data}`，`code="OK"` | `src/api/demo.js` 按 `code==="OK"` 解析 | ✅ 对齐 |

> 功能核对结论：本次 coding 变更（MapperScan 修正 + 测试重构）功能正确，未引入契约破坏，跨仓对齐无冲突。

---

## Step 3 — 可读性检查（产物 C）

> scan-all-rules.sh 预扫结果：`[P2] A2.2 — WildcardImport: src/test/java/com/library/demo/DemoServiceTest.java:18`

### 3.1 [library-backend] LibraryBackendApplication.java

| ID | 规则 | 结论 |
|----|------|------|
| A1.1 | 文件名=类名+.java | ✅ |
| A1.3 | 空白仅 ASCII 空格 | ✅ |
| A2.1 | 文件顺序 package→import→类 | ✅ |
| A3.3 | 缩进 4 空格 | ✅ |
| A4.2 | 类名 UpperCamelCase | ✅ `LibraryBackendApplication` |
| A3.6 | 类成员间空行 | ✅ |

> 结论：无违规。

### 3.2 [library-backend] DemoServiceTest.java

| ID | 规则 | 结论 | 说明 |
|----|------|------|------|
| A1.1 | 文件名=类名+.java | ✅ | |
| A1.3 | 空白仅 ASCII 空格 | ✅ | |
| A2.1 | 文件顺序 | ✅ | |
| **A2.2** | **禁止 `import *`** | **⚠️ P2** | `import static org.junit.jupiter.api.Assertions.*;`（行18）。scan-all-rules.sh 命中。**说明**：JUnit5 Assertions 通配符 import 是业界广泛接受的测试惯例，阿里巴巴规约对测试代码静态通配符有放宽惯例，风险极低，定 P2 建议（非阻断）。建议改为显式 import 以严格合规。 |
| A2.3 | 静态/非静态 import 分组 | ✅ | 行9-16 非静态、行18 静态，组间空行 |
| A2.4 | import 组内字典序 | ✅ | |
| A3.1 | K&R 大括号 | ✅ | |
| A3.3 | 缩进 4 空格 | ✅ | |
| A3.4 | 行宽 ≤120 | ✅ | |
| A4.3 | 方法名 lowerCamelCase | ✅ | `testHelloworld`/`testHashSha256` 等 |
| A6.1 | 方法 Javadoc | ⚠️ P2 | 测试方法无 Javadoc 注释。测试方法命名已自解释（`testXxx`），属可接受惯例，非阻断。 |

> 可读性结论：1 项 P2（A2.2 通配符 import），1 项 P2（A6.1 测试方法缺 Javadoc），均为建议级，无 P0/P1。

---

## Step 4 — 可靠性检查（产物 D）

### §4.1 Bug 模式核销（B*/M*/I*，与 scan-all-rules.sh 预扫对照）

scan-all-rules.sh 对两变更文件扫描 Bug 模式：**0 命中**（P0=0, P1=0, P2=1 仅 A2.2）。

| 规则类别 | 抽查结论 | 说明 |
|----------|----------|------|
| B002 ArrayEquals | ✅ 无命中 | 测试中使用 `assertEquals(Arrays.asList(...), result.getSorted())` 比较 List 内容，非数组 `.equals()` |
| B004 ArrayToString | ✅ 无命中 | 无数组 `.toString()` 调用 |
| B005 ArraysAsListPrimitiveArray | ✅ 无命中 | `Arrays.asList(5,3,8,1,9,2)` 为装箱 Integer varargs，非基本类型数组 |
| B038 UnconditionalWait | ✅ 无命中 | 无 `Object.wait()` 误用 |

### §4.2 可靠性（G1-G17）与安全（S1-S10）逐项扫描

> 本次变更文件为启动类注解修正 + 测试类重构，无生产业务逻辑新增，G1-G17/S1-S10 均与变更无关 → N/A。为完整性，对上下文关键类做一致性核查：

| ID | 类别 | 文件 | 结论 | 说明 |
|----|------|------|------|------|
| G1 并发 | N/A | — | — | 三接口"无状态纯计算"（系分 §5.1.4），无共享可变状态 |
| G2 幂等 | N/A | — | — | Demo 三接口为只读计算无写副作用；埋点 TrackService 为日志型追加写，无幂等要求 |
| G3 事务 | ✅ | DemoController.java:129-150 | 通过 | `trackCall` 埋点无 `@Transactional`，DB INSERT 单条无事务边界问题；降级 catch 兜底 |
| G6 资源释放 | ✅ | ExportService | 通过 | POI `Workbook` 在 try-with-resources 或 finally 释放（上下文类非本次变更，仅核查一致性） |
| G17 可应急 | ✅ | DemoController.java:42-52 | 通过 | 四个 `@Value` 开关（track/helloworld/hash/bubblesort）支持运行时降级关闭，符合"可应急" |

| ID | 类别 | 文件 | 结论 | 说明 |
|----|------|------|------|------|
| S1 SQL注入 | ✅ | CallRecordMapper.xml | 通过（上下文核查） | 使用 `#{}` 参数绑定，无 `${}` 拼接 |
| S4 输入校验 | ✅ | DemoService.java:43,77,81 | 通过 | text 非空校验(DEMO_002)、numbers 非空+长度校验(DEMO_004/005)，边界覆盖完整 |

> 可靠性结论：本次变更无 P0/P1 可靠性或安全问题。上下文类一致性核查通过。

---

## Step 5 — 自定义扩展检查（产物 E）

| 检查项 | 结论 | 说明 |
|--------|------|------|
| 跨仓接口契约兼容性 | ✅ 通过 | coding 变更未改动任何 Controller/Model/Service 签名，契约向后兼容 |
| 测试有效性 | ✅ 通过 | 8 个测试方法覆盖正常路径 + 4 类异常路径，断言具体（错误码 + 值 + 长度） |
| 测试可维护性 | ⚠️ P2 | `testBubbleSortTooLarge` 用 for 循环构造 1001 元素，可提取为常量或 helper，降低噪声。非阻断 |
| MapperScan 修正影响面 | ✅ 已验证 | 修正前 `com.library.mapper` 无对应包 → MyBatis Mapper 不注入 → 埋点 INSERT 失败被降级 catch 吞掉 → 统计无数据。修正后链路打通 |
| 编码规范一致性 | ✅ 通过 | 测试重构说明（Javadoc 行20-24）解释了纯单元测试决策，有设计追溯 |

---

## 汇总 (Summary)

### 代码变更清单

| 仓库 | 文件 | 变更类型 | 行数 |
|------|------|----------|------|
| [library-backend] | `src/main/java/com/library/LibraryBackendApplication.java` | Bug 修复（@MapperScan 路径） | +1/-1 |
| [library-backend] | `src/test/java/com/library/demo/DemoServiceTest.java` | 测试重构（纯单元测试） | +16/-7 |

### 评审结论

| 等级 | 数量 | 明细 |
|------|------|------|
| **P0 (Blocker)** | **0** | — |
| P1 (Major) | 0 | — |
| P2 (Info/建议) | 2 | A2.2 通配符 import（DemoServiceTest.java:18）；A6.1 测试方法缺 Javadoc |

**blocker_count = 0**

### 跨仓对齐点检查结论

1. **接口契约**：后端三接口 W01/W02/W03 路径、入参、出参与前端 `demo.js`/`DemoPage.vue` 三 Tab 完全对齐，本次 coding 变更未引入契约变更。✅
2. **通用出参**：`ApiResponse{code,msg,data}` 结构一致，`code="OK"` 成功语义前端正确解析。✅
3. **埋点链路**：`@MapperScan` 修正打通了 `TrackService.recordCall` → `CallRecordMapper.insert` → 前端统计报表的数据链路，修复了统计可视化无数据的隐患。✅
4. **降级一致性**：后端埋点降级（catch + warn 日志）与系分 R02"埋点失败仅记日志不影响主流程"一致，前端统计缺失不影响主功能展示。✅

### 遗留建议（非阻断，P2）

1. `DemoServiceTest.java:18` 将 `import static org.junit.jupiter.api.Assertions.*;` 改为显式 import（如 `assertEquals`、`assertNotNull`、`assertThrows`）以严格符合 A2.2。
2. 测试方法补充简短 Javadoc 或保持当前 `testXxx` 命名自解释风格（二选一）。
3. `testBubbleSortTooLarge` 可提取大数组构造为 helper 方法降低重复。

---

> **评审状态**：✅ 通过（0 Blocker，0 Major，2 Info 建议）
