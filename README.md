# 盲文点字学习训练器（braille-trainer）

纯前端盲文点字学习与练习工具：课堂练习模式逐题答题、即时反馈、草稿续答，整组完成后一次性生成练习会话与答题记录，驱动错题本与学习进度统计；数据存浏览器 IndexedDB，无第三方 API。

## 快速启动（Docker Compose 一键部署）

```bash
cp .env.example .env && docker compose up -d
```

启动后访问：<http://localhost:20111>

- `docker compose config --quiet` 可校验编排文件；
- 停止：`docker compose down`；重置数据：`docker compose down -v`（本项目为纯前端，数据存浏览器 IndexedDB，卷仅用于 Nginx 容器）。
- 在任意目录名（含中文目录名）下均可启动，不依赖绑定挂载。

## 本地开发方式

```bash
cd frontend
npm install
npm run dev      # http://localhost:20111
npm run build    # tsc -b && vite build，产物在 frontend/dist
```

## 课堂练习模式（核心业务规则）

1. 教师在 `/practice` 选择课程与模式（看形辨字 / 据字拼点 / 听音辨字 / 混合练习）后开始本组练习。
2. **每答一题立即看到对错与错误原因**（字符识别错误、缺少点位、多余点位、点位不匹配、未作答）；题目始终保留在当前会话草稿中，可切题、可重做本题。
3. **没做完就离开（切页/刷新/关浏览器）不会丢进度**：草稿存 IndexedDB `practiceDraft` 表，下次回到练习页自动续答。
4. **未完成期间不计入错题本和学习进度**：草稿不写 `practiceSession` / `answerRecord` 表，API 也只暴露 `finished_at` 非空的已完成会话。
5. **整组完成后一次生成**：一个 IndexedDB 事务内同时落库 1 条 PracticeSession 与 N 条 AnswerRecord（按正确率算百分制得分），随后删除草稿。
6. **错题本按符号展示最近一次答错原因**，同一符号跨会话的历史记录全部保留并可展开查看；按错误原因码筛选。
7. **重练答对即标记为已掌握**：错题本“重练本题”发起单题草稿，答对后该符号移出错题本（掌握状态为 MASTERED），历史答题记录不删除。
8. **学习进度只按已完成会话统计**：课程完成率（至少完成 1 个会话的课程占比）、每门课最近得分、累计正确率、最近会话列表；数据落库后切走再切回仍能看到本次结果。

## 技术栈

| 层 | 技术 |
|---|---|
| 前端 | React 18 + TypeScript + Vite |
| UI | Material UI 可用 + 原生 CSS（六点制点阵自绘） |
| 状态 | Zustand（独立 stores，组件不直写业务状态） |
| 存储 | IndexedDB（`src/api/db.ts` 封装）+ 本地 mock 种子（`src/mocks/seedData.ts`） |
| 语音 | 浏览器 SpeechSynthesis 本地模拟听写，无第三方 API |
| 部署 | Docker Compose + Nginx（多阶段构建） |

## 项目目录结构

```text
frontend/src/
├── api/                  # 按模型分文件的 async API（IndexedDB 封装 + controller 层异常包装）
│   ├── db.ts             # IndexedDB 连接、建表、种子注入、整组提交单事务
│   ├── BrailleSymbol.ts / Lesson.ts / PracticeSession.ts / AnswerRecord.ts
│   ├── PracticeDraft.ts  # 草稿独立表 API
│   └── practiceCommit.ts # 会话/记录 ID 生成入口
├── stores/               # Zustand 独立 store
│   ├── BrailleSymbolStore.ts / LessonStore.ts
│   ├── PracticeSessionStore.ts / AnswerRecordStore.ts   # 只读，仅已完成数据
│   └── PracticeDraftStore.ts                            # 草稿与练习动作编排
├── services/             # service 层（业务规则 + service 异常）
│   ├── practiceService.ts  # 开始/暂存/续答/放弃/整组完成/错题重练
│   ├── gradingService.ts   # 三种模式判题与错误原因
│   ├── mistakeService.ts   # 错题本聚合、掌握状态派生
│   ├── progressService.ts  # 完成率/最近得分/正确率、得分计算
│   └── masteryService.ts   # NEW/LEARNING/FAMILIAR/MASTERED 规则
├── types/                # BrailleSymbol / Lesson / PracticeSession / AnswerRecord /
│                         # PracticeDraft / MistakeEntry / ProgressSummary
├── constants/            # PracticeMode / SymbolCategory / MasteryLevel / MistakeReason /
│                         # logTemplates / errorCodes / errorMessages / statusText
├── constructors/         # 默认对象、表单对象、响应对象（含 PracticeDraftConstructor）
├── components/common/    # BrailleCell / LessonProgress / PracticePanel / ResultBadge /
│                         # ChartPanel / StatusBadge / StatCard / EmptyState
├── components/practice/  # QuestionCard（题目+即时反馈）/ SessionResult（完成总结）
├── hooks/                # usePracticeSession / useIndexedDbStore / useBraillePattern / useHashRoute
├── pages/                # LearnPage / PracticePage / MistakesPage / ProgressPage
├── router/routes.ts
├── utils/                # formatters / logger / errors / controllerError / brailleDots / speech
└── mocks/seedData.ts     # 真实六点制盲文种子（19 字符 / 4 课程 / 示例已完成会话与错题历史）
```

## 环境变量说明

- `COMPOSE_PROJECT_NAME`：Compose 项目名，默认 `braille-trainer`，同时作为容器名前缀。
- `FRONTEND_PORT`：宿主机映射端口，默认 `20111`，容器内固定 80。

## Docker 部署说明

- 根 `docker-compose.yml`：不写 `version:`，顶层 `name: braille-trainer`，只编排 `frontend`。
- 容器名：`${COMPOSE_PROJECT_NAME:-braille-trainer}-frontend`；端口映射：`${FRONTEND_PORT:-20111}:80`。
- `frontend/Dockerfile` 为 Node 构建 + Nginx 托管多阶段镜像；`frontend/nginx.conf` 含 `try_files $uri $uri/ /index.html;` 支持 SPA hash/history 路由。
- 应用数据保存在浏览器 IndexedDB（库名 `braille-trainer`），换浏览器/清站点数据会重置；首次打开自动注入种子数据。
- 常见问题：端口占用改 `.env` 的 `FRONTEND_PORT` 后 `docker compose up -d`；需要重新构建执行 `docker compose up -d --build`。

## 枚举/常量出现位置清单

- **PracticeMode**（CELL_TO_TEXT / TEXT_TO_CELL / LISTENING / MIXED）
  - 常量与文案：`constants/PracticeMode.ts`；类型同名导出
  - 类型引用：`types/PracticeSession.ts`、`types/PracticeDraft.ts`
  - 构造器：`constructors/PracticeSessionConstructor.ts`、`constructors/PracticeDraftConstructor.ts`
  - 日志模板：`constants/logTemplates.ts`（PracticeSession / PracticeDraft 模板）
  - 错误码/消息：`UNSUPPORTED_PRACTICE_MODE`（`constants/errorCodes.ts`、`constants/errorMessages.ts`）
  - service：`services/gradingService.ts`（判题分支）、`services/practiceService.ts`（MIXED 逐题固化）
  - utils：`utils/speech.ts`（题目提示语）、`utils/formatters.ts`（`formatPracticeMode`）、`utils/errors.ts`
  - store：`stores/PracticeDraftStore.ts`；筛选/选择器：练习页模式下拉、错题重练
  - 展示组件/页面：`pages/PracticePage.tsx`、`pages/ProgressPage.tsx`、`components/practice/*`
- **SymbolCategory**（LETTER / NUMBER / PUNCTUATION / CONTRACTION）
  - 常量与文案：`constants/SymbolCategory.ts`；类型引用：`types/BrailleSymbol.ts`
  - 构造器：`constructors/BrailleSymbolConstructor.ts`
  - 日志：`constants/logTemplates.ts`（BrailleSymbol 模板）
  - 错误：`UNSUPPORTED_SYMBOL_CATEGORY`（errorCodes / errorMessages）
  - service：`services/gradingService.ts`（标点接受答案）；utils：`formatters.formatCategory`
  - 筛选器：`pages/LearnPage.tsx` 分类 chips；展示：LearnPage、MistakesPage、`components/common/StatusBadge.tsx`
- **MasteryLevel**（NEW / LEARNING / FAMILIAR / MASTERED）
  - 常量与文案：`constants/MasteryLevel.ts`
  - 构造器：错题/掌握派生不直接落库（由 AnswerRecord 历史计算）
  - 日志：AnswerRecord 模板「答题记录掌握状态变更」（`constants/logTemplates.ts`）
  - service：`services/masteryService.ts`（规则）、`services/mistakeService.ts`
  - utils：`formatters.formatMastery`；筛选器/展示：LearnPage 卡片徽标、MistakesPage 面板徽标
- **MistakeReason**（NOT_ANSWERED / WRONG_CHARACTER / MISSING_DOT / EXTRA_DOT / DOT_MISMATCH）
  - 常量：`constants/MistakeReason.ts`；类型引用：`types/AnswerRecord.ts`、`types/PracticeDraft.ts`、`types/MistakeEntry.ts`
  - service：`gradingService.ts`（产出原因）、`mistakeService.ts`（最近原因聚合）
  - utils：`formatters.formatMistakeReason`；筛选器/展示：MistakesPage 原因 chips、`ResultBadge`、`QuestionCard`、`SessionResult`

## 为什么该项目会牵一发动全身

- 一次“答题”要穿过：页面（PracticePage/QuestionCard）→ store（PracticeDraftStore）→ service（practiceService + gradingService）→ API（PracticeDraft，controller 包装）→ IndexedDB（db.ts），并同步触达日志模板（logTemplates + logger）与错误码/消息。
- 新增一个练习模式或错误原因，必须同步：常量与文案、类型（会话/草稿/记录）、判题分支、formatter 文案、错题本筛选项、即时反馈组件、README 清单。
- 错题本与进度统计都只读“已完成会话 + 答题记录”，草稿模型、提交事务、两个只读 store 与两个派生 service 互相耦合；改掌握规则（masteryService）会同时影响错题本是否列出符号与学习卡片徽标。

## License

MIT
