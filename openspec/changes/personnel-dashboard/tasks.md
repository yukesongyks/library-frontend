# Personnel Dashboard — Tasks

## Phase 1: Backend Foundation

- [ ] **B1**: Create Spring Boot project structure with Maven
- [ ] **B2**: Define Employee entity, repository, and database migration
- [ ] **B3**: Define Budget entity, repository, and database migration
- [ ] **B4**: Define Whitelist entity (with type field for IMPORT/APPROVAL), repository, migration
- [ ] **B5**: Implement EmployeeService (CRUD operations)
- [ ] **B6**: Implement EmployeeController (REST endpoints)
- [ ] **B7**: Implement BudgetService (annual/quarterly/monthly CRUD, rollup)
- [ ] **B8**: Implement BudgetController (with summary endpoint)
- [ ] **B9**: Implement ImportService (CSV/Excel parsing, import whitelist validation)
- [ ] **B10**: Implement ImportController with file upload + template download
- [ ] **B11**: Implement WhitelistService (dual type: IMPORT + APPROVAL)
- [ ] **B12**: Implement WhitelistController
- [ ] **B13**: Implement BudgetApprovalService (approval whitelist check)
- [ ] **B14**: Write unit tests for service layer
- [ ] **B15**: Write integration tests for controllers

## Phase 2: Frontend Foundation (Vue 3 + TypeScript)

- [x] **F1**: Scaffold Vue 3 + Vite + TypeScript project with routing and Pinia
- [x] **F2**: Create API client layer (Axios with base URL config)
- [x] **F3**: Implement EmployeeListPage with search and pagination
- [x] **F4**: Implement EmployeeFormPage (shared create/edit form)
- [x] **F5**: Implement EmployeeDetailPage with budget summary
- [x] **F6**: Implement BudgetPage (annual/quarterly/monthly budget management)
- [x] **F7**: Implement ImportPage (file upload, preview, result report)
- [x] **F8**: Implement WhitelistPage with type toggle (IMPORT / APPROVAL)
- [x] **F9**: Add frontend form validation (VeeValidate / custom)
- [x] **F10**: Write frontend component tests

## Phase 3: Integration & Polish

- [ ] **I1**: End-to-end integration test (frontend ↔ backend)
- [ ] **I2**: Error handling and edge cases (network failure, empty list, large file)
- [ ] **I3**: Loading states and empty states for all pages
- [ ] **I4**: Responsive layout for the dashboard
- [ ] **I5**: Documentation update (README, API docs)
- [ ] **I6**: Final review and cleanup