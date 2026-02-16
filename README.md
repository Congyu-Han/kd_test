# kds-clone

A functional clone-style admin product for the operator platform workflow.

## Run

```bash
pnpm install
pnpm dev:link
```

- Web: `http://127.0.0.1:3000`
- API: `http://127.0.0.1:3001`

If ports are occupied, run:

```bash
API_PORT=3101 WEB_PORT=3100 API_BASE_URL=http://127.0.0.1:3101 pnpm dev:link
```

## Login Accounts

- `sxcdzdl / Han35128819`
- `admin / Passw0rd!`

## Test

```bash
pnpm test
pnpm typecheck
```

## Delivered Modules

- 下级服务商管理
- 销售管理（线上收益钱包、售课订单、月度统计、线下课时订单、分配记录、销售账单）
- 课时/券管理（购买课时、购买记录、培训券定价、派券记录）
- 系统管理（收款账户、部门、用户、权限）
- 课件管理
