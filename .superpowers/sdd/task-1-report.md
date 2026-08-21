# Task 1 Report: 后端脚手架与统一响应 (Backend Scaffold & Unified ApiResponse)

**Status: DONE_WITH_CONCERNS** (build passes; one required placeholder-content deviation, documented below)

## Summary

Implemented the Task 1 backend scaffold in `library-backend-main` exactly per the brief's step content: Spring Boot 3.2.5 project (`pom.xml`), `application.yml` (H2 in-memory, MySQL mode, `spring.sql.init` -> schema.sql/data.sql), `CostApplication` (with `@MapperScan("com.library.cost.mapper")`), the `ApiResponse<T>` record contract (`code/message/data`, static `ok(T)` / `fail(int,String)`), `GlobalExceptionHandler` (`@RestControllerAdvice`, 400 for `IllegalArgumentException`, 500 for `Exception`), and the `@SpringBootTest` context-loads test.

All 6 code/config files are **verbatim** from the brief. The two placeholder resource files deviate only in content (see Deviation below) — required to make Step 7 verification pass. Step 8 (git commit) was **skipped** per the session's GIT READ-ONLY constraint; no git commands were run.

## Files Written (absolute paths)

1. `/root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main/pom.xml` — verbatim from brief (parent spring-boot-starter-parent 3.2.5, java 17, mybatis-plus 3.5.5, poi 5.2.5; deps: web, validation, mybatis-plus-spring-boot3-starter, h2/runtime, mysql-connector-j/runtime, poi-ooxml, lombok/optional, starter-test/test; spring-boot-maven-plugin excluding lombok).
2. `/root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main/src/main/resources/application.yml` — verbatim (port 8080, H2 mem `costdb` MySQL mode, sql.init always -> classpath:schema.sql/data.sql, h2 console enabled, mybatis-plus camel-case).
3. `/root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main/src/main/java/com/library/cost/CostApplication.java` — verbatim.
4. `/root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main/src/main/java/com/library/cost/common/ApiResponse.java` — verbatim (the contract for every later controller: `record ApiResponse<T>(int code, String message, T data)`, `ok(T)` -> code 0/"ok", `fail(int,String)` -> data null).
5. `/root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main/src/main/java/com/library/cost/common/GlobalExceptionHandler.java` — verbatim.
6. `/root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main/src/test/java/com/library/cost/CostApplicationTests.java` — verbatim (single `contextLoads` test).
7. `/root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main/src/main/resources/schema.sql` — placeholder; content `SELECT 1; -- placeholder` (DEV, see below).
8. `/root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main/src/main/resources/data.sql` — placeholder; content `SELECT 1; -- placeholder` (DEV, see below).

README.md and `.git` were not modified. No extra files created (only `target/` build output from Maven, which is gitignored-by-nature and not committed — and commits are skipped anyway).

## Verification

Command (Step 7): `cd /root/.agentix/agentic-dev/runs/DEV-f4ad1a6e-7360-11f1-8c66-df5563d236aa-06a25bdb-8cf6-43bb-b194-c140a741a358/worktree/library-backend-main && mvn -q test`

- **Attempt 1 (with `-- placeholder` -only files): FAILED with exit code 1.**
  Surefire: `Tests run: 1, Failures: 0, Errors: 1` — `CostApplicationTests.contextLoads` could not load the ApplicationContext:
  `BeanCreationException ... dataSourceScriptDatabaseInitializer ... Failed to execute database script from resource [class path resource [schema.sql]]`
  `Caused by: java.lang.IllegalArgumentException: 'script' must not be null or empty` at `ScriptUtils.splitSqlScript(ScriptUtils.java:475)`.
  This was a deterministic content issue, **not** a download timeout and **not** an environment/network failure (dependency resolution itself succeeded — the build compiled and reached surefire).
- **Attempt 2 (after fixing placeholder content): BUILD SUCCESS, exit code 0.**
  Spring context started in 4.538s (HikariPool connected to `jdbc:h2:mem:costdb`, H2 console auto-configured).
  Surefire report (`target/surefire-reports/com.library.cost.CostApplicationTests.txt`):
  `Tests run: 1, Failures: 0, Errors: 0, Skipped: 0, Time elapsed: 6.607 s`
  — matches the expected **Tests run: 1, Failures: 0**.

## Deviation from Brief (required, documented)

**Placeholder resource content**: The brief/constraint instructed each of `schema.sql` and `data.sql` to contain exactly one line `-- placeholder`, expecting startup to succeed. On the actual stack (Spring Boot 3.2.5 -> Spring Framework 6.1.6, `spring-jdbc-6.1.6.jar`), that is impossible: `ScriptUtils.readScript` reads the script line-by-line and **skips every line starting with a comment prefix** (`--`), so a comment-only file yields an empty script string; the new 6.1 internal `splitSqlScript(EncodedResource, ...)` then asserts `'script' must not be null or empty` and the context fails to load.

Root cause verified against the **actual jar** (`/root/.m2/repository/org/springframework/spring-jdbc/6.1.6/spring-jdbc-6.1.6.jar`) via `javap -c -p`: in `private static String readScript(LineNumberReader, String[], String, String)` the bytecode branches to *skip the append* when `startsWithAny(line, commentPrefixes, 0)` is true (offsets 33-44); and `splitSqlScript(EncodedResource,...)` calls `Assert.hasText(script, "'script' must not be null or empty")` as its first op (offset 4). `target/classes/schema.sql` was confirmed present and correct (14 bytes, `-- placeholder`), so the resource was not missing — the empty-script error is inherent to comment-only files.

**Fix applied (smallest change that satisfies Step 7's expected BUILD SUCCESS)**: changed both placeholder files to a single line `SELECT 1; -- placeholder` (valid no-op SQL, keeps the placeholder marker, H2 MySQL-mode compatible, `mode: always` re-run safe). Task 2 overwrites these files with the real schema/data per the brief, so this deviation is contained to this task. All other 6 files remain byte-for-byte per the brief.

## Concerns / Follow-ups

1. **Placeholder deviation** (see above) — flag to the parent/plan owner: if the plan expects `-- placeholder` verbatim anywhere else, note that Spring Boot 3.2.x cannot start with comment-only `schema.sql`/`data.sql`. Not a problem for Task 2+ since real content replaces them.
2. **Step 8 (commit) skipped** per GIT READ-ONLY constraint. No `git add/commit/push` or any git config was executed; `.git` untouched. The repo's files are written but uncommitted.
3. **Expected warning (non-fatal)**: during startup MyBatis logged `No MyBatis mapper was found in 'com.library.cost.mapper' package` — expected at this stage because no mapper interfaces exist yet; later tasks add entities/mappers.
4. `server.port: 8080` and H2 console are per brief; no runtime smoke test of the running app (no controllers exist yet — Task 3+).
5. Maven used the configured Aliyun mirror (`/root/.m2/settings.xml`); downloads completed fine, so no environment/network concerns remain.