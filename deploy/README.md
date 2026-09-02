# MANOONG 云服务器部署

以下命令面向 Ubuntu 24.04 LTS。生产环境的 PostgreSQL 只监听本机，Node API 只监听 `127.0.0.1:3000`，公网入口只有 Nginx 的 80/443。

## 1. 安装运行环境

```bash
sudo apt update
sudo apt install -y postgresql postgresql-contrib nginx certbot python3-certbot-nginx git curl
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo adduser --system --group --home /var/www/manoong manoong
sudo install -d -o manoong -g www-data /var/www/manoong/releases /etc/manoong
sudo install -d -m 750 -o manoong -g www-data /var/lib/manoong/uploads/avatars
```

## 2. 初始化 PostgreSQL

先生成强密码，再在 PostgreSQL 中建立仅本机可用的账户与数据库：

```bash
sudo -u postgres psql
```

```sql
CREATE ROLE manoong LOGIN PASSWORD '替换为随机强密码';
CREATE DATABASE manoong OWNER manoong;
\q
```

保持 PostgreSQL 防火墙端口 5432 不对公网开放。将 `.env.example` 复制为 `/etc/manoong/manoong.env`，权限设为仅服务账户可读：

```bash
sudo cp .env.example /etc/manoong/manoong.env
sudo chown root:manoong /etc/manoong/manoong.env
sudo chmod 640 /etc/manoong/manoong.env
```

生产环境至少修改：`NODE_ENV=production`、`CLIENT_ORIGIN=https://manoong.com`、数据库密码、`CODE_HASH_SECRET`、`RESEND_API_KEY` 和 `RESEND_FROM`。头像使用 release 目录之外的 `AVATAR_UPLOAD_DIR=/var/lib/manoong/uploads/avatars`，并通过 `AVATAR_PUBLIC_BASE_URL=/uploads/avatars` 生成公开地址。可用 `openssl rand -base64 48` 生成验证码摘要密钥。Resend Key 只保存在服务器环境文件中，绝不能放进 Vite 前端变量。

## 3. 构建与迁移

将仓库放到一个新的 release 目录，在该目录执行：

```bash
npm ci
npm run build
npm run db:migrate
sudo ln -sfn /var/www/manoong/releases/当前版本 /var/www/manoong/current
```

每次发布先在新目录构建和迁移，验证后再原子切换 `current` 链接。API 服务已经安装时，切换完成后必须重启进程，让 Node 加载新版本中的路由：

```bash
sudo systemctl restart manoong-api
sudo systemctl is-active manoong-api
curl http://127.0.0.1:3000/api/health
```

如果只更新静态文件而未重启 API，新前端调用新增接口时会收到“接口不存在”。不要把 `.env` 放进仓库或前端构建目录。

## 4. systemd

```bash
sudo cp deploy/systemd/manoong-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable --now manoong-api
sudo systemctl status manoong-api
curl http://127.0.0.1:3000/api/health
```

日志查看：`sudo journalctl -u manoong-api -f`。

## 5. Nginx 与 HTTPS

先确保 `manoong.com` 和 `www.manoong.com` DNS 已指向服务器。首次签发证书时先使用 Certbot 的 Nginx 流程，随后安装仓库配置：

```bash
sudo certbot --nginx -d manoong.com -d www.manoong.com
sudo cp deploy/nginx/manoong.conf /etc/nginx/sites-available/manoong
sudo ln -s /etc/nginx/sites-available/manoong /etc/nginx/sites-enabled/manoong
sudo nginx -t
sudo systemctl reload nginx
sudo certbot renew --dry-run
```

云防火墙只开放 22、80、443；限制 SSH 来源地址更安全。不要开放 Node 的 3000 或 PostgreSQL 的 5432。

## 6. 发布后验证

```bash
curl -i https://manoong.com/api/health
curl -I https://manoong.com/
sudo systemctl is-active manoong-api nginx postgresql
```

随后在浏览器依次验证注册、邮件验证码、登录、刷新保持登录、退出、修改密码后旧 Session 失效。短信在配置真实供应商前只允许开发环境 mock；生产环境会明确拒绝，接入供应商时只需替换 `server/services/sms.service.js` 的实现并使用现有环境变量。
