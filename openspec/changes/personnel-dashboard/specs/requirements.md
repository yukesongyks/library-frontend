# Personnel Dashboard — Requirements (人员看板)

## 1. Employee Basic Information Management

### 1.1 Employee Fields

| Field | Type | Required | Notes |
|-------|------|----------|-------|
| employeeId | String | Yes | Auto-generated unique employee number (e.g., EMP000001) |
| name | String | Yes | Employee full name |
| department | String | Yes | Department name |
| position | String | Yes | Job title/position |
| phone | String | No | Contact phone number |
| email | String | No | Email address |
| hireDate | Date | Yes | Date of employment |
| status | Enum | Yes | ACTIVE / INACTIVE / TERMINATED |
| createdAt | DateTime | Auto | Creation timestamp |
| updatedAt | DateTime | Auto | Last update timestamp |

### 1.2 CRUD Operations

- **Create**: Add a new employee record. `employeeId` auto-generated.
- **Read**: List employees with pagination, search by name/department, filter by status.
- **Update**: Edit any editable field; `employeeId` and `createdAt` immutable.
- **Delete**: Soft delete (set status to TERMINATED).

### 1.3 Scenarios

**Scenario 1: Create employee**
```
Given the user is on the employee list page
When they click "Add Employee" and fill in all required fields
And submit the form
Then the system creates the employee record
And shows a success notification
And the new employee appears in the list
```

**Scenario 2: Search employees**
```
Given the employee list page is open
When the user types "张三" in the search box
Then the list filters to show only employees matching "张三"
```

**Scenario 3: Update employee**
```
Given the employee list page is open
When the user clicks "Edit" on an employee row
And modifies the department field
And saves
Then the employee record is updated
And the list reflects the change
```

## 2. Batch Import

### 2.1 Import Features

- Supported formats: CSV, Excel (.xlsx, .xls)
- Template download available
- Import whitelist validation: only employees whose IDs appear in the import whitelist can be imported
- Import result report: success count, failure count, error details per row

### 2.2 Scenarios

**Scenario 4: Successful batch import**
```
Given the user has a valid CSV file with 10 employees all on the import whitelist
When they navigate to "Import" and upload the file
Then the system imports all 10 employees
And shows "10 succeeded, 0 failed"
```

**Scenario 5: Partial import with whitelist rejections**
```
Given the user has a CSV file with 5 employees, 2 not on the import whitelist
When they upload the file
Then the system imports the 3 whitelisted employees
And shows "3 succeeded, 2 failed — Not in whitelist"
```

**Scenario 6: Import with invalid data**
```
Given the user uploads a file with missing required fields
When the system validates the file
Then it shows validation errors per row
And no records are imported
```

## 3. Cost Budget Management (Annual/Quarterly/Monthly)

### 3.1 Budget Dimensions

Each employee can have budget records with the following dimensions:

| Dimension | Granularity | Example |
|-----------|-------------|---------|
| Annual | One budget per year | 2025 annual budget: ¥100,000 |
| Quarterly | Per quarter of a year | Q1 2025: ¥25,000, Q2 2025: ¥25,000 |
| Monthly | Per month | Jan 2025: ¥8,333 |

### 3.2 Budget Fields per Record

| Field | Type | Notes |
|-------|------|-------|
| budgetId | Long | Auto-generated |
| employeeId | String | FK to employee |
| year | Integer | Budget year (e.g., 2025) |
| quarter | Integer | Nullable: 1-4 for quarterly budget |
| month | Integer | Nullable: 1-12 for monthly budget |
| budgetAmount | Decimal | Allocated budget amount |
| usedAmount | Decimal | Amount already spent |
| remainingAmount | Decimal | Computed: budgetAmount - usedAmount |
| note | String | Optional note |

### 3.3 Scenarios

**Scenario 7: Set annual budget**
```
Given the user opens an employee detail page
When they navigate to "Budget" tab
And set annual budget for 2025 as ¥120,000
Then the system shows the annual budget record
And auto-distributes to quarterly: ¥30,000 per quarter
```

**Scenario 8: View budget breakdown**
```
Given the employee has annual budget ¥120,000
When the user views the budget summary
Then they see:
  Annual 2025: ¥120,000 (Used: ¥45,000 / Remaining: ¥75,000)
  ├── Q1: ¥30,000 (Used: ¥15,000 / Remaining: ¥15,000)
  ├── Q2: ¥30,000 (Used: ¥10,000 / Remaining: ¥20,000)
  ├── Q3: ¥30,000 (Used: ¥0 / Remaining: ¥30,000)
  └── Q4: ¥30,000 (Used: ¥20,000 / Remaining: ¥10,000)
```

**Scenario 9: Update used amount**
```
Given the employee has a budget record
When the user records a cost of ¥5,000 against the monthly budget
Then the system updates usedAmount for the month, quarter, and year
```

## 4. Whitelist Management (Dual Purpose)

### 4.1 Whitelist Types

| Type | Purpose | Scope |
|------|---------|-------|
| IMPORT | Controls which employees can be batch imported | Employee import |
| APPROVAL | Controls which employees can approve budget changes | Budget approval |

### 4.2 Whitelist Fields

| Field | Type | Notes |
|-------|------|-------|
| id | Long | Auto-generated |
| type | Enum | IMPORT / APPROVAL |
| employeeId | String | Employee identifier |
| name | String | Employee name for display |
| note | String | Optional note |
| addedAt | DateTime | When added to whitelist |

### 4.3 Scenarios

**Scenario 10: Add to import whitelist**
```
Given the user is on the whitelist management page
When they select type "Import Whitelist"
And enter employee ID "EMP001" and submit
Then the import whitelist contains "EMP001"
```

**Scenario 11: Add to approval whitelist**
```
Given the user is on the whitelist management page
When they select type "Approval Whitelist"
And enter employee ID "EMP005" with note "Department Manager"
Then the approval whitelist contains "EMP005"
```

**Scenario 12: Import rejected by whitelist**
```
Given the import whitelist contains only "EMP001" and "EMP002"
When the user tries to import a CSV containing "EMP003"
Then the system rejects "EMP003" with "Not in import whitelist"
```

**Scenario 13: Budget change requires approval**
```
Given the approval whitelist contains "EMP005"
When the user tries to modify a budget record over ¥10,000
Then the system requires approval from "EMP005"
And sends a notification to the approver
```