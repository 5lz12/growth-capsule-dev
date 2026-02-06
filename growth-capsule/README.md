# 🌱 成长时间胶囊

一个用于记录孩子成长行为，并基于发展心理学提供分析的 Web 应用。

## 功能特点

- **成长记录**：记录孩子在运动、语言、社交、认知、情感等方面的发展里程碑
- **心理学分析**：基于皮亚杰、埃里克森等经典发展理论，提供专业的行为解读
- **养育建议**：根据发展特点，给出实用的养育建议
- **本地优先**：内置本地分析引擎，无需外部 API 即可使用
- **可扩展架构**：支持无缝接入外部 AI API（GLM/Claude），自动 fallback

## 技术栈

- **前端框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **数据库**: SQLite + Prisma ORM
- **样式**: Tailwind CSS
- **分析引擎**: 本地规则引擎（可扩展为外部 API）

## 项目结构

```
growth-capsule/
├── src/
│   ├── app/                    # Next.js App Router 页面
│   │   ├── api/               # API 路由
│   │   │   ├── analyze/       # 分析 API
│   │   │   └── children/      # 孩子和记录管理
│   │   ├── children/          # 孩子相关页面
│   │   ├── globals.css        # 全局样式
│   │   ├── layout.tsx         # 根布局
│   │   └── page.tsx           # 首页
│   ├── lib/
│   │   ├── analyzers/         # 分析器架构（可扩展）
│   │   │   ├── base.ts           # 基础接口
│   │   │   ├── local-analyzer.ts # 本地分析器
│   │   │   ├── api-analyzer.ts   # 外部 API 分析器
│   │   │   └── analyzer-manager.ts # 分析器管理器
│   │   ├── prisma.ts          # Prisma 客户端
│   │   └── psychology-analysis.ts # 本地心理学规则
│   └── types/
│       └── index.ts           # TypeScript 类型定义
├── prisma/
│   └── schema.prisma          # 数据库模型
└── package.json
```

## 快速开始

### 1. 安装依赖

```bash
cd growth-capsule
npm install
```

### 2. 初始化数据库

```bash
npx prisma db push
```

### 3. 启动开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

## API 设计说明

### 核心接口

#### 1. 成长行为分析

```
POST /api/analyze
```

请求体：
```json
{
  "childAge": 12,          // 月龄
  "behavior": "今天第一次叫妈妈", // 行为描述
  "category": "language",  // 行为类别
  "context": "在家里玩耍时" // 上下文（可选）
}
```

响应：
```json
{
  "success": true,
  "data": {
    "developmentStage": "婴儿晚期（6-12个月）",
    "psychologicalInterpretation": "能有意识地叫'妈妈'标志着语言理解能力...",
    "parentingAdvice": [
      "多与孩子对话",
      "读书、讲故事",
      "耐心倾听"
    ],
    "milestone": "语言：第一个有意义的词",
    "confidence": "high",
    "source": "local"
  }
}
```

#### 2. 孩子管理

```
GET    /api/children       # 获取所有孩子
POST   /api/children       # 创建孩子
GET    /api/children/{id}  # 获取单个孩子
```

#### 3. 记录管理

```
GET    /api/children/{id}/records  # 获取孩子的记录
POST   /api/children/{id}/records  # 创建记录（自动分析）
```

### 分析器架构

应用采用**多层分析器架构**：

1. **本地分析器** (优先级 1)
   - 基于内置的发展心理学规则
   - 始终可用，无需网络
   - 作为 fallback 保证服务可用性

2. **外部 API 分析器** (优先级 10)
   - 可接入 GLM/Claude 等外部 AI
   - 需要配置环境变量
   - 失败时自动 fallback 到本地分析器

**设计优势**：
- ✅ 永远返回 `success: true`，不抛 500 错误
- ✅ 自动选择最佳分析器
- ✅ 外部 API 失败时无感降级
- ✅ 未来接入新 API 无需修改业务代码

### 接入外部 API

只需两步：

1. 配置环境变量：
```bash
AI_API_KEY=your_api_key
AI_API_ENDPOINT=https://api.example.com/v1
```

2. 实现 `src/lib/analyzers/api-analyzer.ts` 中的 `callExternalAPI` 方法

## 行为类别

- `motor` - 运动发展（翻身、坐、爬、走、跑）
- `language` - 语言发展（咿呀、词汇、句子）
- `social` - 社交能力（注视、笑、分享）
- `cognitive` - 认知发展（探索、模仿、提问）
- `emotional` - 情感发展（依恋、自我意识、情绪调节）

## 数据模型

### Child（孩子）
- id, name, birthDate, gender
- createdAt, updatedAt

### Record（记录）
- id, childId, category, behavior
- date, ageInMonths
- notes, analysis, milestones
- createdAt, updatedAt

## 许可证

MIT
