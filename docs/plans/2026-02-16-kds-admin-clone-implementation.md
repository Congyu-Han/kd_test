# KDS Admin Clone Full Product Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a function-complete, usable admin product that matches the screenshoted system style and fully links frontend/backend modules.

**Architecture:** Keep the lightweight stack (`node:http` backend + plain JS frontend) and refactor into modular data-backed APIs with JSON persistence. Frontend remains SPA but is redesigned to the target admin layout with reusable list/filter/table renderers and per-module handlers.

**Tech Stack:** Node.js, TypeScript (API/Web servers), plain JavaScript (browser app), Vitest, PNPM workspaces.

---

### Task 1: Add Failing API Contract Tests for Full Modules

**Files:**
- Modify: `apps/api/src/server.spec.ts`

**Step 1: Write the failing test**

```ts
it('supports providers list, wallet summary and departments with auth', async () => {
  const token = await loginAndGetToken(baseUrl);
  const providers = await authedGet(baseUrl, '/api/v1/providers', token);
  expect(providers.data.list.length).toBeGreaterThan(0);

  const wallet = await authedGet(baseUrl, '/api/v1/sales/wallet/summary', token);
  expect(wallet.data.totalIncome).toBeTypeOf('number');

  const departments = await authedGet(baseUrl, '/api/v1/system/departments', token);
  expect(departments.data.list.length).toBeGreaterThan(0);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @kds/api test -- src/server.spec.ts`
Expected: FAIL with 404 or missing fields for new routes.

**Step 3: Write minimal implementation**

Implement minimal route handlers/data shape for tested routes in API server.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @kds/api test -- src/server.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/server.spec.ts apps/api/src/server.ts
git commit -m "test(api): add full-module contract coverage and minimal route support"
```

### Task 2: Implement JSON Persistence and Shared Helpers

**Files:**
- Create: `apps/api/src/data/store.ts`
- Modify: `apps/api/src/server.ts`
- Modify: `apps/api/src/server.spec.ts`

**Step 1: Write the failing test**

```ts
it('persists provider creation into json store', async () => {
  const token = await loginAndGetToken(baseUrl);
  const created = await authedPost(baseUrl, '/api/v1/providers', token, { name: '新服务商' });
  const providers = await authedGet(baseUrl, '/api/v1/providers', token);
  expect(providers.data.list.some((x: any) => x.id === created.data.id)).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @kds/api test -- src/server.spec.ts`
Expected: FAIL before persistence helpers exist.

**Step 3: Write minimal implementation**

Add JSON load/save helpers and wire write endpoints to flush updates.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @kds/api test -- src/server.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/data/store.ts apps/api/src/server.ts apps/api/src/server.spec.ts
git commit -m "feat(api): add json persistence store for admin data"
```

### Task 3: Build Complete API Routes by Module

**Files:**
- Modify: `apps/api/src/server.ts`
- Modify: `apps/api/src/server.spec.ts`

**Step 1: Write the failing test**

```ts
it('supports courseware query with filters and pagination', async () => {
  const token = await loginAndGetToken(baseUrl);
  const response = await authedGet(baseUrl, '/api/v1/courseware?keyword=运输&page=1&pageSize=5', token);
  expect(response.data.page).toBe(1);
  expect(response.data.pageSize).toBe(5);
  expect(Array.isArray(response.data.list)).toBe(true);
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @kds/api test -- src/server.spec.ts`
Expected: FAIL due missing endpoint behavior.

**Step 3: Write minimal implementation**

Implement remaining module routes from design with uniform list envelope.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @kds/api test -- src/server.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/server.ts apps/api/src/server.spec.ts
git commit -m "feat(api): implement full module routes and unified pagination envelope"
```

### Task 4: Add Export CSV Endpoint and Tests

**Files:**
- Modify: `apps/api/src/server.ts`
- Modify: `apps/api/src/server.spec.ts`

**Step 1: Write the failing test**

```ts
it('exports providers as csv', async () => {
  const token = await loginAndGetToken(baseUrl);
  const res = await fetch(`${baseUrl}/api/v1/export/providers`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  expect(res.status).toBe(200);
  expect(res.headers.get('content-type')).toContain('text/csv');
  expect(await res.text()).toContain('serviceProviderName');
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @kds/api test -- src/server.spec.ts`
Expected: FAIL with missing export route/content type.

**Step 3: Write minimal implementation**

Implement CSV rendering helper and export route by module key.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @kds/api test -- src/server.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/server.ts apps/api/src/server.spec.ts
git commit -m "feat(api): add csv export endpoint for list modules"
```

### Task 5: Redesign Frontend Shell to Screenshot Style

**Files:**
- Modify: `apps/web/src/server.ts`
- Modify: `apps/web/src/server.spec.ts`

**Step 1: Write the failing test**

```ts
it('renders target admin shell sections', () => {
  const html = buildPage('http://127.0.0.1:3001');
  expect(html).toContain('安驾服务商平台');
  expect(html).toContain('id="left-nav"');
  expect(html).toContain('id="main-toolbar"');
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @kds/web test -- src/server.spec.ts`
Expected: FAIL with missing ids/labels.

**Step 3: Write minimal implementation**

Refactor HTML/CSS template to match screenshot structure and visuals.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @kds/web test -- src/server.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/server.ts apps/web/src/server.spec.ts
git commit -m "feat(web): rebuild admin shell to screenshot layout"
```

### Task 6: Implement Frontend Module Renderers and API Linkage

**Files:**
- Modify: `apps/web/src/client-app.js`
- Modify: `apps/web/tests/full-regression.spec.ts`

**Step 1: Write the failing test**

```ts
test('smoke data flow includes providers and courseware pages', async () => {
  const result = runFullRegressionSmoke();
  expect(result.modules).toContain('providers');
  expect(result.modules).toContain('courseware');
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @kds/web test -- tests/full-regression.spec.ts`
Expected: FAIL before module coverage is implemented.

**Step 3: Write minimal implementation**

Implement:
- full nested menu config,
- per-module list/filter/toolbar rendering,
- query/reset/pagination,
- create/edit actions,
- export trigger.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @kds/web test -- tests/full-regression.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/web/src/client-app.js apps/web/tests/full-regression.spec.ts
git commit -m "feat(web): implement full module pages with live api linkage"
```

### Task 7: End-to-End QA and Cross-Module Verification

**Files:**
- Modify: `apps/api/src/server.spec.ts`
- Modify: `apps/web/tests/phase1-smoke.spec.ts`
- Modify: `README.md`

**Step 1: Write the failing test**

```ts
it('new provider appears in related sales filters', async () => {
  const token = await loginAndGetToken(baseUrl);
  await authedPost(baseUrl, '/api/v1/providers', token, { name: '联动服务商' });
  const wallet = await authedGet(baseUrl, '/api/v1/sales/wallet/transactions?provider=联动服务商', token);
  expect(wallet.data.list).toBeDefined();
});
```

**Step 2: Run test to verify it fails**

Run: `pnpm --filter @kds/api test -- src/server.spec.ts`
Expected: FAIL before linkage query support.

**Step 3: Write minimal implementation**

Add cross-module linkage filtering and ensure UI query sends matching params.

**Step 4: Run test to verify it passes**

Run: `pnpm --filter @kds/api test -- src/server.spec.ts`
Expected: PASS

**Step 5: Commit**

```bash
git add apps/api/src/server.spec.ts apps/web/tests/phase1-smoke.spec.ts README.md
git commit -m "test: add linkage qa checks and update runbook"
```

### Task 8: Final Verification and Integration

**Files:**
- Modify: `docs/plans/2026-02-16-kds-admin-clone-implementation.md` (checklist completion marks)

**Step 1: Run full test suite**

Run: `pnpm test`
Expected: all workspace tests pass.

**Step 2: Run typecheck**

Run: `pnpm typecheck`
Expected: pass.

**Step 3: Manual smoke run**

Run: `pnpm dev:link`
Expected: Web `:3000`, API `:3001` available; login and key pages operational.

**Step 4: Commit final polish**

```bash
git add .
git commit -m "feat: ship full functional kds admin clone (plan A)"
```
