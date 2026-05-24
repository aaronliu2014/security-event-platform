# Security Event Platform - Phase 3: 核心功能后端实现

## 概述

Phase 3 实现了安全事件平台的核心后端功能，包括用户认证、用户管理、事件分析和通知系统。

## 已实现的功能

### 1. 用户认证系统 (Authentication)

#### API 端点

- **POST /api/auth/register** - 用户注册
  ```json
  {
    "email": "user@example.com",
    "username": "username",
    "password": "password123",
    "full_name": "Full Name"
  }
  ```

- **POST /api/auth/login** - 用户登录
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
  返回JWT token用于后续认证

#### 特性

- 使用 bcryptjs 加密密码
- JWT token 生成和验证（有效期24小时）
- 认证中间件保护受限端点

### 2. 用户管理 (User Management)

#### API 端点

- **GET /api/users/profile** - 获取用户资料
- **PUT /api/users/profile** - 更新用户资料
- **GET /api/users/preferences** - 获取用户偏好设置
- **PUT /api/users/preferences** - 更新用户偏好设置

#### 用户偏好设置选项

```javascript
{
  "collection_frequency": "daily",        // hourly, daily, weekly, monthly
  "notification_enabled": true,           // 启用通知
  "email_notification_enabled": true,     // 启用邮件通知
  "data_sources": ["nvd", "cve"],        // 数据来源过滤
  "alert_severity_threshold": "medium"    // critical, high, medium, low, info
}
```

### 3. 事件分析与聚类 (Analysis & Clustering)

#### API 端点

- **GET /api/analysis/clusters** - 获取事件聚类
- **POST /api/analysis/tags/:eventId** - 为事件添加标签
- **GET /api/analysis/tags/:eventId** - 获取事件标签
- **GET /api/analysis/trends** - 获取事件趋势
- **GET /api/analysis/severity-distribution** - 获取严重度分布

#### 聚类算法

- 基于 CVE ID 精确匹配聚类
- 基于关键词相似度 (Jaccard similarity >= 0.3) 聚类
- 自动提取安全相关关键词和 CVE ID

### 4. 通知系统 (Notification System)

#### API 端点

- **GET /api/users/notifications** - 获取用户通知
- **PUT /api/users/notifications/:id/read** - 标记通知为已读
- **PUT /api/users/notifications/mark-all-read** - 标记所有通知为已读
- **GET /api/users/notifications/history** - 获取通知历史
- **DELETE /api/users/notifications/:id** - 删除通知

#### 特性

- 邮件通知支持 (nodemailer)
- 通知规则匹配 (基于严重度、来源、用户偏好)
- 通知历史记录追踪
- 异步邮件发送（非阻塞）

## 数据库表结构

### users
```sql
id, email, username, password_hash, full_name, created_at, updated_at
```

### user_preferences
```sql
id, user_id, collection_frequency, notification_enabled, 
email_notification_enabled, data_sources (JSON), 
alert_severity_threshold, created_at, updated_at
```

### event_tags
```sql
id, event_id, tag_name, severity, created_at
```

### notifications
```sql
id, user_id, event_id, title, message, severity, source, 
is_read, created_at, updated_at
```

### notification_history
```sql
id, user_id, notification_id, sent_at, delivery_method, 
delivery_status, error_message
```

## 新增依赖

```json
{
  "bcryptjs": "^2.4.3",
  "jsonwebtoken": "^9.1.2",
  "nodemailer": "^6.9.7"
}
```

## 环境变量配置

```env
# JWT
JWT_SECRET=your-secret-key-change-in-production

# Email/SMTP
SMTP_HOST=localhost
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@example.com
SMTP_PASSWORD=your-email-password
SMTP_FROM=noreply@security-event-platform.local
```

## 使用示例

### 1. 注册新用户

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

### 2. 用户登录

```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

响应:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "email": "user@example.com",
      "username": "user123",
      "full_name": "John Doe"
    }
  }
}
```

### 3. 获取用户资料 (需要认证)

```bash
curl -X GET http://localhost:3000/api/users/profile \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

### 4. 更新用户偏好设置

```bash
curl -X PUT http://localhost:3000/api/users/preferences \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "collection_frequency": "hourly",
    "notification_enabled": true,
    "email_notification_enabled": true,
    "data_sources": ["nvd", "cve"],
    "alert_severity_threshold": "high"
  }'
```

### 5. 获取事件聚类

```bash
curl -X GET http://localhost:3000/api/analysis/clusters \
  -H "Authorization: Bearer TOKEN"
```

### 6. 获取用户通知

```bash
curl -X GET http://localhost:3000/api/users/notifications?limit=50&offset=0 \
  -H "Authorization: Bearer TOKEN"
```

## 文件结构

```
backend/src/
├── middleware/
│   └── auth.js                 # 认证中间件
├── models/
│   ├── User.js                 # 用户模型
│   ├── UserPreference.js        # 用户偏好模型
│   └── Notification.js          # 通知模型
├── routes/
│   ├── auth.js                 # 认证路由
│   ├── users.js                # 用户路由
│   ├── analysis.js             # 分析路由
│   ├── events.js               # 事件路由 (已存在)
│   └── admin.js                # 管理路由 (已存在)
├── services/
│   ├── authService.js          # 认证服务
│   ├── userService.js          # 用户服务
│   ├── analysisService.js      # 分析服务
│   ├── notificationService.js  # 通知服务
│   └── eventService.js         # 事件服务 (已存在)
├── config/
│   └── index.js                # 配置文件
├── utils/
│   ├── database.js             # 数据库连接
│   └── logger.js               # 日志工具
└── index.js                    # 应用入口
```

## 安全考虑

1. **密码安全**: 所有密码使用 bcryptjs 加盐加密
2. **JWT 令牌**: 使用 HS256 算法，24小时过期
3. **输入验证**: 所有 API 端点都进行输入验证
4. **HTTPS**: 生产环境应使用 HTTPS
5. **环境变量**: 敏感信息存储在环境变量中，不提交到版本控制

## 通知规则

通知根据以下规则匹配:
1. 用户已启用通知 (notification_enabled = true)
2. 事件严重度 <= 用户设置的阈值
3. 事件来源在用户的数据源列表中（如果指定了）

严重度等级 (从高到低):
- critical (0)
- high (1)
- medium (2)
- low (3)
- info (4)

## 性能优化

- 异步邮件发送，不阻塞 API 响应
- 数据库连接池管理
- JWT 令牌无状态验证
- 分页查询支持

## 下一步 (Phase 4)

- [ ] 前端用户界面实现
- [ ] API 文档完善
- [ ] 性能优化和缓存策略
- [ ] 更复杂的分析算法
- [ ] 实时通知推送
- [ ] 用户权限管理

## 测试

运行测试:
```bash
npm test
```

## 许可证

MIT
