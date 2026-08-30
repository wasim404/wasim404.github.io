# MANOONG API

后端为独立 Express 应用，保留现有 Vite React 前端。入口是 `server/index.js`，职责按 `routes / controllers / services / middleware / db / validation` 分离。

## 本地启动

1. 安装 PostgreSQL，创建数据库和账户。
2. 将仓库根目录 `.env.example` 复制为 `.env`，填写数据库与 Resend 参数。
3. 执行迁移并分别启动 API、前端：

```bash
npm install
npm run db:migrate
npm run dev:server
npm run dev
```

Vite 会将 `/api` 代理到 `http://127.0.0.1:3000`。邮件优先使用 `RESEND_API_KEY` 与 `RESEND_FROM`，未配置时才回退 SMTP；开发环境两者都没有时，验证码写入 API 终端。SMS 明确使用 mock，生产环境在实现真实供应商适配器前会拒绝发送。

## API

- `GET /api/health`
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`（需登录）
- `GET /api/auth/me`（需登录）
- `POST /api/auth/email/send-code`
- `POST /api/auth/email/verify`
- `POST /api/auth/phone/send-code`（需登录）
- `POST /api/auth/phone/verify`（需登录）
- `POST /api/user/change-password`（需登录）
- `GET /api/data`（需登录）
- `PUT /api/data/:key`（需登录）
- `POST /api/data/migrate`（需登录，首次合并本机数据）
- `GET /api/notes`（需登录，获取当前账户的随手记）
- `POST /api/notes`（需登录，创建随手记）
- `DELETE /api/notes/:id`（需登录，删除当前账户的指定随手记）

所有写请求需要与 `CLIENT_ORIGIN` 相同的 `Origin` 请求头。认证凭据仅通过 HttpOnly Session Cookie 传递，前端不接触或保存 Session Token。

## 验证

```bash
npm run lint
npm run test:server
npm run build
npm audit --omit=dev
```

连接真实 PostgreSQL 后，注册一个邮箱用户并从 API 终端读取开发验证码；验证邮箱后再测试登录、`/me`、退出和修改密码。生产服务器部署见 `deploy/README.md`。
