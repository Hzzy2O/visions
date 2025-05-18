# Visions - 区块链创作者平台

Visions是一个基于Sui区块链的创作者平台，允许创作者分享优质内容并通过订阅模式获得收益。该项目包含智能合约和Next.js前端应用程序。

## 项目概述

Visions平台允许：
- 创作者可以注册并创建个人资料
- 创作者可以上传多种类型的内容（图片、视频、文档、音频）
- 用户可以订阅创作者以访问其优质内容
- 基于区块链的订阅管理和支付系统

## 技术栈

### 前端
- Next.js
- React
- TanStack Query (React Query)
- Framer Motion (动画)
- @mysten/dapp-kit (Sui钱包集成)

### 智能合约
- Sui Move语言
- Sui Framework

## 智能合约结构

合约位于`visions_contract`目录，包含以下核心模块：

### 1. Creator 模块（creator.move）
- 管理创作者资料
- 允许用户成为创作者
- 存储创作者的名称、描述和内容数量

### 2. Content 模块（content.move）
- 管理创作者的内容元数据
- 支持多种内容类型（图片、视频、文档、音频）
- 整合加密存储来保护优质内容

### 3. Subscription 模块（subscription.move）
- 管理用户订阅
- 处理付款和访问控制
- 通过Sui支付订阅费用

## 前端功能

### 主页 (`app/page.tsx`)
- 展示创作者内容
- 根据不同标准过滤和排序内容
- 吸引新创作者加入平台

### 创作者设置 (`app/creator/setup/`)
- 创作者注册流程
- 创建和管理创作者资料

### 内容管理 (`app/content/`)
- 上传和管理内容
- 设置内容访问权限

### 钱包集成 (`app/providers.tsx`)
- Sui钱包连接
- 交易通知

## 如何部署

### 智能合约部署

1. 进入合约目录：
```bash
cd visions_contract
```

2. 编译合约：
```bash
sui move build
```

3. 部署到Sui测试网：
```bash
sui client publish --gas-budget 100000000
```

4. 更新`app/contracts.ts`中的合约地址

### 前端应用部署

1. 安装依赖：
```bash
npm install
```

2. 开发模式运行：
```bash
npm run dev
```

3. 生产构建：
```bash
npm run build
npm start
```

## 使用流程

### 创作者
1. 连接Sui钱包
2. 通过"Become Creator"按钮注册成为创作者
3. 设置创作者资料
4. 创建订阅服务并设置价格
5. 上传内容并设置为优质内容

### 用户
1. 连接Sui钱包
2. 浏览可用的创作者和内容
3. 订阅感兴趣的创作者
4. 访问订阅的优质内容

## 开发计划

- [ ] 实现内容推荐算法
- [ ] 添加社交功能（评论、点赞）
- [ ] 支持NFT内容发布
- [ ] 多层次订阅模型
- [ ] 支持更多内容类型

## 贡献

欢迎提交Pull Request或Issue。

## 许可证

[MIT](LICENSE) 
