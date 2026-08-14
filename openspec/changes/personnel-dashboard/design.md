# Personnel Dashboard — Design

## Architecture

```
┌─────────────────────────────────────────────────┐
│               Frontend (Vue 3 + TS)              │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Employee │  │ Import   │  │ Whitelist     │  │
│  │ Module   │  │ Module   │  │ Module        │  │
│  └────┬─────┘  └────┬─────┘  └──────┬────────┘  │
│       │             │               │           │
│  ┌────┴─────────────┴───────────────┴────┐      │
│  │        Vue Router + Pinia Store       │      │
│  └───────────────────┬───────────────────┘      │
│                      │                          │
│  ┌───────────────────┴───────────────────┐      │
│  │        API Client (Axios)             │      │
│  └───────────────────┬───────────────────┘      │
├──────────────────────┼─────────────────────────┤
│              Backend (Spring Boot)              │
│  ┌──────────┐  ┌──────────┐  ┌───────────────┐  │
│  │Employee  │  │ Import   │  │ Whitelist     │  │
│  │Controller│  │Controller│  │ Controller   │  │
│  └────┬─────┘  └────┬─────┘  └──────┬────────┘  │
│       └──────────────┴───────────────┘           │
│                         │                        │
│  ┌──────────────────────┴──────────────────────┐ │
│  │           Service Layer                     │ │
│  │  EmployeeService  ImportService  Whitelist  │ │
│  │  BudgetService    BudgetApprovalService     │ │
│  └──────────────────────┬──────────────────────┘ │
│                         │                        │
│  ┌──────────────────────┴──────────────────────┐ │
│  │           Repository Layer                  │ │
│  │  EmployeeRepository  WhitelistRepository    │ │
│  │  BudgetRepository                           │ │
│  └──────────────────────┬──────────────────────┘ │
│                         │                        │
│                    ┌────┴────┐                   │
│                    │  MySQL  │                   │
│                    └─────────┘                   │
└─────────────────────────────────────────────────┘
```

## Frontend Route Design

| Route | Component | Description |
|-------|-----------|-------------|
| `/employees` | EmployeeListPage | Employee list with search/filter/pagination |
| `/employees/new` | EmployeeFormPage | Add new employee |
| `/employees/:id` | EmployeeDetailPage | View/edit employee details |
| `/employees/:id/budgets` | BudgetPage | Budget management (annual/quarterly/monthly) |
| `/import` | ImportPage | Batch import page |
| `/whitelist` | WhitelistPage | Dual whitelist management (import + approval) |

## Frontend Component Tree (Vue 3)

```
App.vue
 └── AppLayout.vue
      ├── SideNav.vue (navigation: Employees, Import, Whitelist)
      ├── EmployeeListPage.vue
      │    ├── SearchBar.vue
      │    ├── EmployeeTable.vue
      │    │    └── EmployeeRow.vue (with Edit/Delete actions)
      │    └── Pagination.vue
      ├── EmployeeFormPage.vue (shared for create/edit)
      │    ├── EmployeeForm.vue
      │    │    ├── TextInput.vue (name, phone, email, position)
      │    │    ├── SelectInput.vue (department, status)
      │    │    └── DatePicker.vue (hireDate)
      │    └── FormActions.vue (Save / Cancel)
      ├── EmployeeDetailPage.vue
      │    ├── EmployeeInfoCard.vue
      │    ├── BudgetSummary.vue (annual/quarterly/monthly breakdown)
      │    └── ActionButtons.vue (Edit / Delete / Back)
      ├── BudgetPage.vue
      │    ├── BudgetYearSelector.vue
      │    ├── BudgetQuarterTable.vue
      │    ├── BudgetMonthTable.vue
      │    └── BudgetForm.vue (add/edit budget record)
      ├── ImportPage.vue
      │    ├── TemplateDownload.vue
      │    ├── FileUploader.vue (CSV/Excel)
      │    ├── ImportPreview.vue
      │    └── ImportResultReport.vue
      └── WhitelistPage.vue
           ├── WhitelistTypeToggle.vue (IMPORT / APPROVAL)
           ├── WhitelistTable.vue
           ├── AddToWhitelistForm.vue
           └── BatchAddButton.vue
```

## API Contract

### Employee API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees` | List employees (paginated, searchable) |
| GET | `/api/employees/{id}` | Get employee detail |
| POST | `/api/employees` | Create employee |
| PUT | `/api/employees/{id}` | Update employee |
| DELETE | `/api/employees/{id}` | Soft-delete employee |

**Query params for GET /api/employees:**
- `page` (int, default 0)
- `size` (int, default 20)
- `search` (string, optional — matches name or department)
- `status` (enum, optional — filter by status)

**Employee JSON body:**
```json
{
  "name": "string",
  "department": "string",
  "position": "string",
  "phone": "string",
  "email": "string",
  "hireDate": "2025-01-01",
  "status": "ACTIVE"
}
```

### Budget API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/employees/{id}/budgets` | List budgets for employee (filterable by year) |
| POST | `/api/employees/{id}/budgets` | Create budget record |
| PUT | `/api/employees/{id}/budgets/{budgetId}` | Update budget (needs approval if over threshold) |
| GET | `/api/employees/{id}/budgets/summary?year=2025` | Get budget summary (annual/quarterly/monthly rollup) |

### Import API

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/employees/import` | Batch import with file upload |
| GET | `/api/employees/import/template` | Download import template |

### Whitelist API

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/whitelist` | List whitelist entries (filterable by type) |
| POST | `/api/whitelist` | Add to whitelist (body includes type) |
| POST | `/api/whitelist/batch` | Batch add to whitelist |
| DELETE | `/api/whitelist/{id}` | Remove from whitelist |
| GET | `/api/whitelist/check?employeeId=X&type=IMPORT` | Check if employee is on whitelist |

## Data Model

### Employee Table

```sql
CREATE TABLE employee (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  employee_id VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(100) NOT NULL,
  department VARCHAR(100) NOT NULL,
  position VARCHAR(100) NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(100),
  hire_date DATE NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  deleted BOOLEAN DEFAULT FALSE
);
```

### Budget Table

```sql
CREATE TABLE budget (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  employee_id VARCHAR(20) NOT NULL,
  year INT NOT NULL,
  quarter INT,
  month INT,
  budget_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  used_amount DECIMAL(12,2) NOT NULL DEFAULT 0.00,
  note VARCHAR(255),
  status VARCHAR(20) DEFAULT 'ACTIVE',
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  FOREIGN KEY (employee_id) REFERENCES employee(employee_id),
  UNIQUE KEY uk_employee_period (employee_id, year, quarter, month)
);
```

### Whitelist Table

```sql
CREATE TABLE whitelist (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  type VARCHAR(20) NOT NULL,
  employee_id VARCHAR(20) NOT NULL,
  name VARCHAR(100) NOT NULL,
  note VARCHAR(255),
  added_at DATETIME NOT NULL,
  UNIQUE KEY uk_type_employee (type, employee_id)
);
```

## Cross-repo Alignment

- **Frontend→Backend API**: All endpoints follow `/api/` prefix
- **Frontend framework**: Vue 3 + TypeScript + Vite + Pinia + Vue Router
- **Response format**: Standard `{ code: 0, data: {...}, message: "ok" }`
- **Paginated response**: `{ content: [...], totalElements, totalPages, number, size }`
- **Import response**: `{ successCount, failureCount, failures: [{ row, error }] }`
- **Budget summary response**: `{ year, totalBudget, totalUsed, quarters: [...], months: [...] }`
- **Date format**: ISO 8601 (`yyyy-MM-dd` for dates, `yyyy-MM-dd'T'HH:mm:ss` for timestamps)