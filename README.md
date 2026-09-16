# bulb-connect

一个 5×5 连灯泡益智小游戏。旋转线材和灯泡，让电源点亮所有灯泡。

在线试玩：push 到 `main` 后自动部署到 GitHub Pages。

## 技术栈

- React 18 + TypeScript + Vite
- Vitest + React Testing Library（TDD）
- SVG 绘制棋盘，无图片资源
- GitHub Actions 自动构建 + 部署到 GitHub Pages

## 快速开始

```bash
npm install
npm run dev       # 本地开发服务器
npm test          # 运行全部单元测试
npm run typecheck # TypeScript 类型检查
npm run build     # 生产构建（输出到 dist/）
npm run preview   # 本地预览生产构建
```

## 游戏规则

- 5×5 棋盘，1 个电源（不可旋转）、5 个灯泡、其余为线材（直线/弯线/T 形/十字形）。
- 点击格子顺时针旋转 90°（十字形旋转后接口不变）。
- 相邻两格需面对面接口同时存在才导通。
- 所有灯泡点亮即胜利；未通电的线材不阻止胜利。
- 生成器先构造覆盖全盘的生成树（保证可解），再随机旋转打乱。

## 项目结构

```
src/
├── game/
│   ├── types.ts          # 核心类型与常量
│   ├── directions.ts     # 方向、相反方向、顺时针旋转
│   ├── power.ts          # 通电遍历（BFS）与胜利判定
│   ├── generator.ts      # 生成树、解状态、打乱
│   └── gameReducer.ts    # 旋转/重置/新游戏 reducer
├── components/
│   ├── Board.tsx         # 5×5 棋盘
│   ├── Tile.tsx          # 单格 SVG 渲染
│   └── GameControls.tsx  # 新游戏/重置按钮
├── App.tsx               # 组装与状态
├── main.tsx
└── test-utils.ts         # 测试用确定性随机数
```

## 部署

推送到 `main` 分支后，GitHub Actions（`.github/workflows/deploy.yml`）自动：

1. 安装依赖
2. 运行测试
3. 生产构建
4. 发布到 GitHub Pages

首次部署需在仓库 Settings → Pages 中将 Source 设为 "GitHub Actions"。

## 许可

MIT
