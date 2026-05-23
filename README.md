# Security Event Platform

**企业级安全事件监测与分析平台**

## 项目概述

自动从多个信息源（NVD、CISA、Twitter、中文安全媒体等）定期收集网络安全、数据安全和隐私相关的安全事件，进行智能分析和展示。

## 核心功能

- ✅ **多源数据收集** - NVD/CISA API、RSS 源、社交媒体
- ✅ **自定义频度** - 用户可配置收集间隔（日/周/月）
- ✅ **事件分析** - 聚类、分类、趋势识别
- ✅ **可视化展示** - Web 仪表板、事件列表、搜索
- ✅ **智能通知** - 邮件/推送通知、规则配置

## 技术架构

### 后端
- Node.js + Express.js
- PostgreSQL（主数据库）
- Redis（缓存）
- Node Cron（任务调度）

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
│   │   ├── services/          # 业务逻辑
│   │   ├── models/            # 数据模型
│   │   ├── middleware/        # 中间件
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

### 事件管理（开发中）
- `GET /api/events` - 获取事件列表
- `GET /api/events/:id` - 获取事件详情
- `GET /api/events/search` - 搜索事件

### 用户管理（开发中）
- `POST /api/users/register` - 用户注册
- `POST /api/users/login` - 用户登录
- `GET /api/users/profile` - 获取用户信息
- `PUT /api/users/preferences` - 更新用户偏好设置

## 开发进度

- [x] 项目初始化与架构
- [ ] 数据收集模块
- [ ] 核心功能后端
- [ ] 前端界面开发
- [ ] 集成与测试
- [ ] 部署与上线

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
