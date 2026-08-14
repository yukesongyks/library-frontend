# Proposal: Personnel Dashboard (人员看板)

## Intent

Develop an independent personnel dashboard system for managing employee records, supporting CRUD operations, batch import with whitelist validation, cost budget tracking (annual/quarterly/monthly), and budget approval whitelist.

## Scope

- Employee basic information CRUD (create, read, update, delete)
- Employee list with search, filter, and pagination
- Batch import employees via CSV/Excel with whitelist validation
- Cost budget management with annual/quarterly/monthly dimensions
- Dual whitelist management (import whitelist + budget approval whitelist)
- Budget approval workflow based on whitelist

## Non-goals

- Advanced HR features (attendance, payroll, performance review)
- Full RBAC (beyond basic whitelist, deferred to future)
- Real-time sync with external HR systems
- Advanced reporting/analytics dashboards

## Affected Areas

| Area | Repo | Impact |
|------|------|--------|
| Data model | library-backend | New `employee`, `budget`, `whitelist` tables |
| REST API | library-backend | New controller, service, repository for employee, budget, whitelist |
| Frontend routes | library-frontend | New app with routes: `/employees`, `/import`, `/whitelist`, `/budgets` |
| Frontend components | library-frontend | Vue 3 components: employee list, form, import dialog, budget planner, whitelist mgmt |
| Configuration | both | New project scaffolding, database migration, dependency updates |

## Risk

- **Low**: Independent system, no existing functionality affected
- **Medium**: Batch import performance with large files; need chunking/progress indicator
- **Medium**: Budget time-dimension complexity (annual/quarterly/monthly rollup)
- **Low**: Whitelist validation must be atomic during import