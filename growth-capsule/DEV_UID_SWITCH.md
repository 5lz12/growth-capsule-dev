# DEV_UID_SWITCH - 多用户切换开发指南

## 1. 目的说明

### 为什么需要多 UID 切换？

成长时间胶囊正在从"单用户局域网应用"迁移到"多用户架构"。在开发和测试阶段，需要模拟多个独立用户来验证：

- **数据隔离**：用户 A 的孩子和记录对用户 B 完全不可见
- **权限控制**：用户 B 无法通过 URL/API 访问用户 A 的资源
- **文件隔离**：上传的图片存储在用户专属目录下

### 这个机制如何模拟未来微信用户？

当前的 `uid` 机制设计为直接对接微信小程序的 `openid`：

```
当前开发态:  X-DEV-UID: uid_alice  →  getCurrentUid() → "uid_alice"
未来生产态:  微信 openid: "oXyz..."  →  getCurrentUid() → "oXyz..."
```

`User` 表预留了 `externalIds` 字段（JSON），用于存储 `openid` / `unionid` 映射。
开发态的 `uid_alice` 在功能上与未来的真实 openid 完全等价。

---

## 2. 快速开始（5 分钟跑通）

### 前提条件

确保已安装依赖并完成数据库迁移：

```bash
cd growth-capsule

# 安装依赖
npm install

# 执行多用户迁移（含 schema 推送 + 数据迁移）
npm run db:migrate-multiuser
```

迁移脚本会自动创建 3 个用户：
| UID | 用途 |
|---|---|
| `uid_default_local` | 默认用户，历史数据的 owner |
| `uid_alice` | 测试用户 A |
| `uid_bob` | 测试用户 B |

### 启动服务

```bash
npm run dev
```

打开 http://localhost:3000 — 右上角会出现 **DEV: Default** 的深色浮动按钮。

---

## 3. 三种切换 UID 的方式

### 方式一：浏览器 Dev Toolbar（推荐日常使用）

1. 打开浏览器访问 http://localhost:3000
2. 点击右上角 **DEV: Default** 按钮
3. 在弹出面板中选择预设用户（Alice / Bob / Default），或输入自定义 UID
4. 页面会自动刷新，显示对应用户的数据

**原理**：通过 `/api/dev/switch-uid` 设置 `dev-uid` cookie，后续所有请求自动携带。

### 方式二：HTTP Header（curl / Postman / 程序化测试）

通过 `X-DEV-UID` 请求头指定用户身份，**优先级最高**，会覆盖 cookie 和环境变量。

**curl 示例：**

```bash
# 以 uid_alice 的身份获取孩子列表
curl -H "X-DEV-UID: uid_alice" http://localhost:3000/api/children

# 以 uid_bob 的身份获取孩子列表（应该是空的或不同数据）
curl -H "X-DEV-UID: uid_bob" http://localhost:3000/api/children

# 以 uid_alice 创建一个孩子
curl -X POST http://localhost:3000/api/children \
  -H "Content-Type: application/json" \
  -H "X-DEV-UID: uid_alice" \
  -d '{"name":"小明","birthDate":"2023-01-15","gender":"male"}'

# 以 uid_bob 尝试访问 uid_alice 的孩子（应返回 403）
curl -H "X-DEV-UID: uid_bob" http://localhost:3000/api/children/<alice的childId>
```

**Postman 示例：**

1. 打开请求的 Headers 标签
2. 添加 Key: `X-DEV-UID`，Value: `uid_alice`
3. 发送请求

### 方式三：环境变量（服务端全局默认）

设置 `DEV_DEFAULT_UID` 环境变量来改变服务端默认用户：

```bash
# 方式 A：在 .env 文件中设置
echo "DEV_DEFAULT_UID=uid_alice" >> .env

# 方式 B：启动时设置
DEV_DEFAULT_UID=uid_alice npm run dev

# 方式 C：export 后启动
export DEV_DEFAULT_UID=uid_alice
npm run dev
```

**注意**：环境变量优先级低于 Header 和 Cookie。修改后需要重启 dev server。

### 优先级总结

```
X-DEV-UID Header  (最高 - API 测试用)
      ↓
dev-uid Cookie    (浏览器 Dev Toolbar 设置)
      ↓
DEV_DEFAULT_UID   (环境变量 - 服务端默认)
      ↓
uid_default_local (兜底 - 历史数据默认 owner)
```

---

## 4. 推荐测试流程（逐步）

### 测试 1：基本数据隔离

```bash
# Step 1: 用 Alice 创建一个孩子
curl -X POST http://localhost:3000/api/children \
  -H "Content-Type: application/json" \
  -H "X-DEV-UID: uid_alice" \
  -d '{"name":"Alice的宝宝","birthDate":"2023-06-01","gender":"female"}'
# 记下返回的 childId（例如 "clxyz..."）

# Step 2: 用 Alice 查看自己的孩子列表
curl -H "X-DEV-UID: uid_alice" http://localhost:3000/api/children
# 预期：能看到 "Alice的宝宝"

# Step 3: 切换到 Bob 查看孩子列表
curl -H "X-DEV-UID: uid_bob" http://localhost:3000/api/children
# 预期：空列表 []（Bob 没有任何孩子）

# Step 4: Bob 尝试直接访问 Alice 的孩子
curl -H "X-DEV-UID: uid_bob" http://localhost:3000/api/children/<alice的childId>
# 预期：403 PERMISSION_DENIED
```

### 测试 2：记录级隔离

```bash
# Step 1: 用 Alice 给孩子创建记录
curl -X POST http://localhost:3000/api/children/<alice的childId>/records \
  -H "Content-Type: application/json" \
  -H "X-DEV-UID: uid_alice" \
  -d '{"category":"language","behavior":"今天说了第一句完整的话","date":"2024-06-15"}'
# 记下返回的 recordId

# Step 2: 用 Bob 尝试删除 Alice 的记录
curl -X DELETE -H "X-DEV-UID: uid_bob" http://localhost:3000/api/records/<alice的recordId>
# 预期：403 PERMISSION_DENIED

# Step 3: 用 Alice 可以正常删除自己的记录
curl -X DELETE -H "X-DEV-UID: uid_alice" http://localhost:3000/api/records/<alice的recordId>
# 预期：成功删除
```

### 测试 3：浏览器切换

1. 打开 http://localhost:3000
2. 通过 Dev Toolbar 切换到 Alice → 创建孩子和记录
3. 切换到 Bob → 确认看不到 Alice 的数据
4. 切换回 Alice → 数据依然在

### 测试 4：迁移幂等性

```bash
# 重复执行迁移脚本
npm run db:migrate-multiuser

# 预期：所有输出都是 "already have ownerUid" / "User ensured"
# 没有错误，没有重复数据
```

---

## 5. 常见问题排查

### Q: 看不到数据怎么办？

**检查当前 UID：**

```bash
curl http://localhost:3000/api/dev/switch-uid
# 返回 { "uid": "当前生效的uid" }
```

**常见原因：**
- 历史数据的 `ownerUid` 是 `uid_default_local`，如果你切换到了 `uid_alice`，自然看不到
- 解决：切换回 `uid_default_local`（即 Dev Toolbar 中的 "Default"）

### Q: 权限错误（403），如何确认是预期行为？

返回体结构：
```json
{
  "success": false,
  "error": "PERMISSION_DENIED",
  "message": "无权访问此资源"
}
```

如果你正在用 uid_bob 访问 uid_alice 的资源 — **这就是预期行为！** 说明隔离生效了。

如果你用 uid_alice 访问自己的资源却得到 403：
1. 检查资源的 `ownerUid` 是否确实是 `uid_alice`
2. 通过 Prisma Studio 查看：`npm run db:studio`，检查对应记录的 `ownerUid` 字段

### Q: 如何清空/重置开发态数据？

```bash
# 方式 1：删除数据库并重建（最干净）
rm prisma/growth-capsule.db
npm run db:migrate-multiuser

# 方式 2：通过 Prisma Studio 手动删除
npm run db:studio
# 在 GUI 中删除不需要的记录

# 方式 3：只清除特定用户的数据（SQL）
npx prisma db execute --stdin <<'SQL'
DELETE FROM Record WHERE ownerUid = 'uid_alice';
DELETE FROM Child WHERE ownerUid = 'uid_alice';
SQL
```

### Q: 如何回滚多用户迁移？

```bash
# Step 1: 运行回滚脚本（恢复文件路径引用）
npm run db:rollback-multiuser

# Step 2: 恢复旧的 schema.prisma（git checkout）
git checkout -- prisma/schema.prisma

# Step 3: 重新推送 schema
npx prisma db push
```

### Q: Dev Toolbar 在生产环境会显示吗？

不会。组件内部有 `process.env.NODE_ENV === 'production'` 检查，生产构建会自动移除。

### Q: 如何添加新的测试用户？

```bash
# 通过 Prisma Studio
npm run db:studio
# 在 User 表中新增一行

# 或通过代码
npx prisma db execute --stdin <<'SQL'
INSERT OR IGNORE INTO User (uid, status, createdAt, updatedAt)
VALUES ('uid_charlie', 'active', datetime('now'), datetime('now'));
SQL
```

---

## 6. 架构参考

### getCurrentUid() 优先级链

```
src/lib/auth.ts → getCurrentUid(request: NextRequest): string
```

```
┌─────────────────────────┐
│  X-DEV-UID Header       │ ← curl / Postman
├─────────────────────────┤
│  dev-uid Cookie         │ ← 浏览器 Dev Toolbar
├─────────────────────────┤
│  DEV_DEFAULT_UID env    │ ← .env / 启动参数
├─────────────────────────┤
│  uid_default_local      │ ← 兜底默认值
└─────────────────────────┘
```

### 受保护的 API 路由

| 路由 | 方法 | 隔离方式 |
|---|---|---|
| `/api/children` | GET | `where: { ownerUid: uid }` |
| `/api/children` | POST | `data: { ownerUid: uid }` |
| `/api/children/[id]` | GET | `checkOwnership()` |
| `/api/children/[id]/avatar` | POST | `checkOwnership()` |
| `/api/children/[id]/records` | GET/POST | `checkOwnership()` + `ownerUid` filter |
| `/api/children/[id]/record-with-image` | POST | `checkOwnership()` + `ownerUid` in create |
| `/api/records/[id]` | PUT/DELETE | `checkOwnership()` via record |
| `/api/records/[id]/favorite` | POST | `checkOwnership()` via record |
| `/api/upload/image` | POST | Upload to user-namespaced dir |
| `/api/import` | POST | `checkOwnership()` + `ownerUid` in create |

### 文件存储路径

```
public/uploads/users/{ownerUid}/avatars/{filename}
public/uploads/users/{ownerUid}/records/{filename}
```
