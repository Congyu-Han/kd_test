# KDS Admin Clone Design (Function-Complete, Plan A)

## 1. Architecture and Scope

- Frontend: `apps/web/src/server.ts` and `apps/web/src/client-app.js` as a single-page admin shell powered by plain JavaScript.
- Backend: `apps/api/src/server.ts` as a REST-like Node HTTP service.
- Storage: local JSON persistence. Data loads on boot and flushes after write operations.
- Auth: login issues bearer token. Frontend stores token and sends it with each API request.

### Full Module Scope

- Lower-level service provider management.
- Sales management: online wallet, sales orders, monthly statistics, offline class-hour order management, enterprise allocation records, training-sales ledger.
- Class-hour/coupon management: purchase class-hours, purchase records, coupon pricing, coupon dispatch records.
- System management: payment account management, department management, user management, permission management.
- Courseware management.

### Interaction Baseline

- Every list page supports search/filter/reset/pagination/empty-state/row actions.
- Online wallet supports export and date quick-ranges.
- Menu switching triggers real API calls and renders real data.

## 2. Data Model and API Contract

## Core Data Models

- `users`: account, password, displayName, role, status, departmentId.
- `roles`: role name with permission list.
- `permissions`: permission keys like `provider.read`, `course.write`.
- `departments`: tree-like records with `parentId`.
- `serviceProviders`: provider information for the main table.
- `providerAccounts`: account management data bound to providers.
- `walletTransactions`: transaction flow rows for online income wallet.
- `salesOrders`: sales order list.
- `monthlyStats`: monthly aggregated report rows.
- `offlineOrders`: offline class-hour orders.
- `distributionRecords`: enterprise class-hour allocation records.
- `salesLedgers`: ledger rows for the two personnel training sales bills.
- `couponConfigs`: coupon pricing setup.
- `couponDispatches`: coupon dispatch history.
- `courseware`: title, filters, interactions, duration, status, updatedAt, testOnly.
- `paymentAccounts`: platform payment account records.

## API Routes (`/api/v1`)

### Auth

- `POST /auth/login`
- `POST /auth/logout`
- `GET /me`
- `GET /menu`

### Providers

- `GET /providers`
- `POST /providers`
- `PATCH /providers/:id`
- `PATCH /providers/:id/status`
- `GET /providers/:id/accounts`
- `POST /providers/:id/accounts`

### Sales

- `GET /sales/wallet/summary`
- `GET /sales/wallet/transactions`
- `GET /sales/orders`
- `GET /sales/monthly-stats`
- `GET /sales/offline-orders`
- `GET /sales/distributions`
- `GET /sales/ledgers`

### Quota/Coupon

- `GET /quota/purchases`
- `POST /quota/purchases`
- `GET /quota/records`
- `GET /coupon/configs`
- `POST /coupon/configs`
- `GET /coupon/dispatches`
- `POST /coupon/dispatches`

### System

- `GET /system/payment-accounts`
- `POST /system/payment-accounts`
- `PATCH /system/payment-accounts/:id`
- `GET /system/departments`
- `POST /system/departments`
- `PATCH /system/departments/:id`
- `DELETE /system/departments/:id`
- `GET /system/users`
- `POST /system/users`
- `PATCH /system/users/:id`
- `GET /system/roles`
- `POST /system/roles`

### Courseware

- `GET /courseware`
- `POST /courseware`
- `PATCH /courseware/:id`
- `GET /courseware/:id`

### Export

- `GET /export/:module`

## Contract Rules

- Unified envelope: `{ code, message, requestId, data }`.
- List envelope: `data: { list, page, pageSize, total }`.
- Frontend reuses shared request and table rendering utilities.
- Basic menu-level and action-level permission visibility.

## 3. Error Handling, QA and Acceptance

## Error Handling

- Unified error codes: `unauthorized`, `forbidden`, `invalid_input`, `not_found`, `conflict`, `server_error`.
- All write APIs validate input and return user-readable messages.
- Frontend shows a unified error strip and keeps filter state after failures.
- Session expiration redirects to login with explicit notice.

## QA Verification

- API level:
  - auth lifecycle,
  - at least one read + one write endpoint per module,
  - export returns CSV content.
- UI level:
  - menu switching loads live data,
  - filters/reset/pagination work,
  - create/edit refresh list,
  - empty-state is visible when list is empty.
- Linkage:
  - provider creation is visible in related pages,
  - department/user relation updates,
  - courseware filter and test-only switch linkage.

## Acceptance

- `pnpm dev:link` starts web + api.
- `http://127.0.0.1:3000` shows full admin modules.
- pages are functional and connected to APIs.
- tests pass with `pnpm -r test`.
- deliver function mapping from screenshot features to implemented modules.
