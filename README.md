# Security Event Platform

**企业级安全事件监测与分析平台**

## 项目概述

自动从多个信息源（NVD、CISA、Twitter、中文安全媒体等）定期收集网络安全、数据安全和隐私相关的安全事件，进行智能分析和展示。

## 核心功能

- ✅ **多源数据收集** - NVD/CISA API、RSS 源、社交媒体
- ✅ **自定义频度** - 用户可配置收集间隔（日/周/月）
- ✅ **用户认证系统** - JWT 令牌、密码加密 (bcryptjs)
- ✅ **用户管理** - 资料管理、偏好设置
- ✅ **事件分析** - 聚类、分类、趋势识别
- ✅ **通知系统** - 邮件通知、规则匹配、历史记录
- ✅ **可视化展示** - Web 仪表板、事件列表、搜索

## 技术架构

### 后端
- Node.js + Express.js
- PostgreSQL（主数据库）
- Redis（缓存）
- Node Cron（任务调度）
- bcryptjs（密码加密）
- jsonwebtoken（JWT 认证）
- nodemailer（邮件发送）

### 前端
- React 18
- Ant Design 5
- Zustand（状态管理）
- Axios（HTTP 请求）

### 部署
- Docker + Docker Compose
- 云部署支持（AWS/Azure/阿里云）

## 快速开始

### 前置要求
- Docker & Docker Compose
- Node.js 18+ （本地开发）
- PostgreSQL 12+ （本地开发）

### 使用 Docker Compose（推荐）

```bash
# 启动所有服务
docker-compose up -d

# 查看日志
docker-compose logs -f backend

# 停止服务
docker-compose down
```

访问：
- 前端：http://localhost:3001
- 后端 API：http://localhost:3000
- 数据库：localhost:5432
- Redis：localhost:6379

### 本地开发

#### 后端
```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

#### 前端
```bash
cd frontend
npm install
echo "REACT_APP_API_URL=http://localhost:3000/api" > .env.local
npm start
```

## 项目结构

```
security-event-platform/
├── backend/                    # Node.js + Express 后端
│   ├── src/
│   │   ├── index.js           # 入口文件
│   │   ├── config/            # 配置文件
│   │   ├── routes/            # API 路由
│   │   │   ├── auth.js        # 认证路由
│   │   │   ├── users.js       # 用户路由
│   │   │   ├── analysis.js    # 分析路由
│   │   │   ├── events.js      # 事件路由
│   │   │   └── admin.js       # 管理路由
│   │   ├── services/          # 业务逻辑
│   │   │   ├── authService.js
│   │   │   ├── userService.js
│   │   │   ├── analysisService.js
│   │   │   ├── notificationService.js
│   │   │   └── eventService.js
│   │   ├── models/            # 数据模型
│   │   │   ├── User.js
│   │   │   ├── UserPreference.js
│   │   │   └── Notification.js
│   │   ├── middleware/        # 中间件
│   │   │   └── auth.js        # JWT 认证中间件
│   │   ├── tasks/             # 定时任务
│   │   └── utils/             # 工具函数
│   ├── package.json
│   ├── Dockerfile
│   └── README.md
├── frontend/                   # React 前端
│   ├── src/
│   │   ├── components/        # 组件
│   │   ├── pages/             # 页面
│   │   ├── services/          # API 服务
│   │   ├── store/             # 状态管理
│   │   └── styles/            # 样式
│   ├── public/
│   ├── package.json
│   ├── Dockerfile
│   └── README.md
├── docker-compose.yml         # Docker Compose 配置
└── README.md
```

## API 端点

### 健康检查
- `GET /api/health` - 服务器状态

### 用户认证
- `POST /api/auth/register` - 用户注册
- `POST /api/auth/login` - 用户登录

### 用户管理
- `GET /api/users/profile` - 获取用户资料
- `PUT /api/users/profile` - 更新用户资料
- `GET /api/users/preferences` - 获取用户偏好
- `PUT /api/users/preferences` - 更新用户偏好

### 通知系统
- `GET /api/users/notifications` - 获取通知
- `PUT /api/users/notifications/:id/read` - 标记为已读
- `PUT /api/users/notifications/mark-all-read` - 全部标记已读
- `GET /api/users/notifications/history` - 通知历史
- `DELETE /api/users/notifications/:id` - 删除通知

### 事件分析
- `GET /api/events` - 获取事件列表
- `GET /api/events/:id` - 获取事件详情
- `GET /api/analysis/clusters` - 事件聚类
- `POST /api/analysis/tags/:eventId` - 添加事件标签
- `GET /api/analysis/tags/:eventId` - 获取事件标签
- `GET /api/analysis/trends` - 事件趋势
- `GET /api/analysis/severity-distribution` - 严重度分布

## 使用示例

### 用户注册
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "username": "user123",
    "password": "password123",
    "full_name": "John Doe"
  }'
```

### 用户登录
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

### 获取用户资料（需要认证）
```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer <token>"
```

### 更新用户偏好设置
```bash
curl -X PUT http://localhost:3000/api/users/preferences \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "collection_frequency": "daily",
    "notification_enabled": true,
    "email_notification_enabled": true,
    "data_sources": ["nvd", "cve"],
    "alert_severity_threshold": "high"
  }'
```

## 开发进度

- [x] Phase 1: 项目初始化与架构
- [x] Phase 2: 数据收集模块
- [x] Phase 3: 核心功能后端（用户认证、用户管理、事件分析、通知系统）
- [ ] Phase 4: 前端界面开发
- [ ] Phase 5: 集成与测试
- [ ] Phase 6: 部署与上线

## 环境变量配置

### 必需变量
```env
# 服务器
PORT=3000
NODE_ENV=development

# 数据库
DB_USER=postgres
DB_PASSWORD=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=security_events

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_SECRET=your-secret-key-change-in-production

# 邮件 (可选，用于邮件通知)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
SMTP_FROM=noreply@security-event-platform.local
```

## 贡献指南

1. Fork 项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 联系方式

- 项目主页：https://github.com/yourusername/security-event-platform
- 问题反馈：https://github.com/yourusername/security-event-platform/issues
