# 盲文点字学习训练器（braille-trainer）

纯前端盲文点字学习与练习工具：点阵字符卡片、四种练习模式（看符识字 / 看字摆点 / 听音辨字 / 混合）、错题本与学习进度统计，数据全部保存在浏览器 IndexedDB，不接入任何第三方 API。

## 快速启动（推荐 Docker）

```bash
cp .env.example .env && docker compose up -d
```

启动后访问：<http://localhost:20111>

停止与重置：

```bash
docker compose down        # 停止
docker compose down -v     # 停止（本项目为纯前端，无命名卷数据；可清重建）
```

> 任意目录名（含中文目录名）下均可启动：构建上下文只使用相对路径，容器内不依赖宿主机目录名。

## 访问地址或 CLI 示例

| 页面 | 路由 | 说明 |
|---|---|---|
| 学习卡片 | <http://localhost:20111/learn> | 点阵卡片、字符解释、难度/分类切换、字符新建编辑 |
| 练习模式 | <http://localhost:20111/practice> | 按课程逐题练习，即时反馈，草稿可续答 |
| 错题本 | <http://localhost:20111/mistakes> | 按符号聚合错题、最近答错原因、重练、标记已掌握 |
| 学习进度 | <http://localhost:20111/progress> | 课程完成率、最近得分、趋势/原因/难度图表、数据导入导出 |

## 练习模式业务规则（重要）

1. **逐题即时反馈**：每提交一题立刻看到对错与错误原因，题目保留在当前会话（可回看不可改答）。
2. **草稿与续答**：没做完就离开，草稿留在 IndexedDB meta 区；下次回到 `/practice` 自动接着答。
3. **未完成不落库**：草稿期间不生成 `PracticeSession` / `AnswerRecord`，因此**不计入错题本和学习进度**；放弃草稿则已答内容全部丢弃。
4. **整组一次提交**：全部题目完成后，在同一 IndexedDB 事务中一次写入 1 条练习会话与全部答题记录，随后清掉草稿并缓存本次结算结果，切回页面仍能看到。
5. **错题本按符号展示最近一次答错原因**：重练答对后该符号自动标记为“已掌握”，也可手动标记；**答题历史完整保留**。
6. **学习进度只统计已完成会话**：课程完成率（至少完成一次的课程占比）与最近得分（时间最晚的已完成会话得分）。

## 本地开发方式

```bash
cd frontend
npm install
npm run dev      # http://localhost:20111
npm run build    # 类型检查 + 产物构建到 dist/
node smoke-runner.mjs   # 端到端业务冒烟测试（fake-indexeddb，36 项断言）
```

## 技术栈

| 层 | 技术 |
|---|---|
| 前端框架 | React 18 + TypeScript + Vite 5 |
| UI | Material UI（依赖在列）+ 自研组件与 CSS |
| 路由 | react-router-dom 6（BrowserRouter + SPA fallback） |
| 状态管理 | Zustand（4 个实体 store + practiceFlowStore + mistakeStore） |
| 本地存储 | IndexedDB（原生封装，5 个 object store，含跨 store 事务） |
| 图表/语音 | 自研 SVG 图表；Web Speech API 本地朗读听写题 |
| 耗时计算 | Web Worker（`src/workers/statsWorker.ts`） |
| 部署 | Docker Compose + Nginx 多阶段构建 |

## 项目目录结构

```text
frontend/src/
├── api/                  # IndexedDB 读写（按模型分文件：BrailleSymbol/Lesson/PracticeSession/AnswerRecord/Meta/seed）
├── controllers/          # 业务编排层（practice/mistake/symbol/data），独立包装异常
├── services/             # 领域服务（question/mastery/mistake/progress/symbol/lesson）
├── stores/               # Zustand 独立 store
├── types/                # 数据模型类型定义（枚举为 constants 的类型镜像）
├── constants/            # 枚举、日志模板、错误码/错误消息、状态文案
├── constructors/         # 默认对象/表单对象/响应对象/草稿/结算构造器
├── components/           # common/ 共享组件 + SymbolEditor/SpeakButton
├── hooks/                # useBraillePattern / usePracticeSession / useIndexedDbStore / useStatsWorker
├── pages/                # learn / practice / mistakes / progress 四个路由页面
├── router/               # routes.ts 路由配置
├── workers/              # statsWorker.ts
├── config/               # APP_CONFIG（读取 Vite 环境变量）
├── utils/                # db/http/logger/errors/formatters/braille/id
└── mocks/                # 真实盲文点位种子数据（50 个字符 + 6 课程 + 已完成会话与答题历史）
```

## 环境变量说明

| 变量 | 默认值 | 说明 |
|---|---|---|
| `COMPOSE_PROJECT_NAME` | `braille-trainer` | Compose 项目名与容器名前缀 |
| `FRONTEND_PORT` | `20111` | 宿主机映射端口（容器内固定 80） |
| `VITE_API_BASE` | `/api` | 请求封装基址（本地模拟模式不发请求） |
| `VITE_LOG_LEVEL` | `info` | 日志级别 debug/info/warn/silent |
| `VITE_IDB_NAME` | `braille_trainer_db` | IndexedDB 库名 |
| `VITE_IDB_VERSION` | `1` | IndexedDB 版本 |

配置读取链路刻意分散：根 `.env(.example)` → `docker-compose.yml` → `frontend/.env.example` → Vite `import.meta.env` → `src/config/index.ts` → `utils/http.ts` 与 `utils/logger.ts`。

## Docker 部署说明

- 根 `docker-compose.yml`：顶层 `name: braille-trainer`，不写 `version:`，只编排 `frontend` 一个服务。
- 容器名：`${COMPOSE_PROJECT_NAME:-braille-trainer}-frontend`；端口：`${FRONTEND_PORT:-20111}:80`。
- `frontend/Dockerfile`：Node 20 多阶段构建 → Nginx 1.27 托管静态文件。
- `frontend/nginx.conf`：`try_files $uri $uri/ /index.html;` 支持 BrowserRouter 刷新。
- 纯前端应用无外部数据库，不使用命名卷；学习数据存于访问者浏览器 IndexedDB。
- 常见问题：
  - 端口占用：改根目录 `.env` 中 `FRONTEND_PORT` 后 `docker compose up -d`。
  - 页面空白/404 刷新：确认 Nginx 配置含 SPA fallback（已内置）。
  - 数据不显示：检查浏览器是否禁用 IndexedDB（隐私模式），页面会给出明确错误提示。

## 核心数据模型

| 模型 | 关键字段 | 贯穿位置 |
|---|---|---|
| BrailleSymbol | id, cell_pattern, letter, pinyin, category, difficulty, audio_hint_key | seed/api/service/controller/store/learn+practice+mistakes+progress |
| Lesson | id, title, symbol_ids, stage, estimated_minutes, unlock_rule | seed/api/service/store/LearnPage/进度统计 |
| PracticeSession | id, lesson_id, mode, started_at, finished_at, score, mistake_count, total_count, source, title | api/controller/constructor/store/practice/progress |
| AnswerRecord | id, session_id, symbol_id, user_answer, correct, latency_ms, mistake_reason, answered_at, variant | 随会话原子批量写入，驱动错题本与进度 |
| PracticeDraft | session_key, lesson_id, mode, source, symbol_ids, variants, answers, started_at | meta 区草稿，未完成不落正式库 |
| PracticeResult | session_id, score, correct_count, mistake_count, started_at/finished_at | meta 区缓存最近一次结算 |
| MistakeBookEntry | symbol, mastery, latestWrong, wrong_count, history | 错题本服务推导视图 |

## 枚举/常量出现位置清单

### PracticeMode（CELL_TO_TEXT / TEXT_TO_CELL / LISTENING / MIXED）

- 常量与文案：`constants/PracticeMode.ts`（含每模式默认错题原因映射）
- 类型：`types/PracticeMode.ts`（re-export）
- store：`stores/practiceFlowStore.ts`、`stores/PracticeSessionStore.ts`
- 构造器：`constructors/PracticeSessionConstructor.ts`、`constructors/PracticeDraftConstructor.ts`
- 日志模板：`constants/logTemplates.ts`（PRACTICE_SESSION_LOG_TEMPLATES 内嵌四模式）
- 错误消息：`constants/errorMessages.ts`（MODE_UNSUPPORTED、MODE_ERROR_SUFFIX）
- 筛选器：`constants/statusText.ts`（STATUS_FILTER_OPTIONS.PracticeMode）、`pages/LearnPage.tsx`、`pages/PracticePage.tsx` 模式切换
- 展示组件：`components/common/StatusBadge.tsx`、`PracticePanel.tsx`、`ProgressPage.tsx`
- 服务/控制器：`services/questionService.ts`（MIXED 逐题定题型）、`controllers/practiceController.ts`

### SymbolCategory（LETTER / NUMBER / PUNCTUATION / CONTRACTION）

- 常量与文案：`constants/SymbolCategory.ts`；类型：`types/SymbolCategory.ts`
- store：`stores/BrailleSymbolStore.ts`（categoryFilter）
- 构造器：`constructors/BrailleSymbolConstructor.ts`
- 日志模板：`constants/logTemplates.ts`（BRAILLE_SYMBOL_LOG_TEMPLATES）
- 错误消息：`constants/errorMessages.ts`（IMPORT_FAILED 提示）
- 筛选器：`LearnPage.tsx` 分类下拉、`MistakesPage.tsx`、`constants/statusText.ts`
- 展示组件：`StatusBadge`、`SymbolEditor.tsx`、`BrailleCell` 所在卡片
- 数据：`mocks/seedData.ts`、`services/symbolService.ts`、`services/questionService.ts`（同类干扰项）

### MasteryLevel（NEW / LEARNING / FAMILIAR / MASTERED）

- 常量与文案：`constants/MasteryLevel.ts`；类型：`types/MasteryLevel.ts`
- store：`stores/mistakeStore.ts`（masteryFilter）
- 构造器：错题掌握度不经构造器落库，而由 `services/masteryService.ts` 推导
- 日志模板：`constants/logTemplates.ts`（MASTERY_LOG_TEMPLATES，内嵌四档）
- 错误消息：`constants/errorMessages.ts`（MASTERY_MARK_CONFLICT）
- 筛选器：`MistakesPage.tsx` 掌握状态筛选、`constants/statusText.ts`
- 展示组件：`StatusBadge`（mastery-level 配色）、错题行徽标
- 控制器：`controllers/mistakeController.ts`（重练/手动标记/取消标记）

### 其他枚举

- `MistakeReason`：`constants/MistakeReason.ts` ↔ `types/MistakeReason.ts`；出现在判题（questionService）、错误消息、错题本筛选与表格、进度原因分布图、AnswerRecord.mistake_reason。
- `Difficulty`：`constants/Difficulty.ts`；出现在字符构造器、学习页筛选/卡片、SymbolEditor、进度难度分布图。

## 为什么该项目会“牵一发动全身”

- 枚举在 `constants/` 定义、`types/` 镜像、`statusText/errorMessages/logTemplates` 同步文案、构造器给默认值、service/controller 判分支、store 持有筛选、页面做下拉、`StatusBadge` 配色：新增一个枚举值至少触达 7 处。
- 每个实体都有独立的 api / service / controller / store / constructor，且日志模板（`constants/logTemplates.ts`，每实体 ≥4 条）、错误码（`constants/errorCodes.ts`）、错误消息（`constants/errorMessages.ts`）分文件存放并被多层引用；service 与 controller 分别包装 `AppError`，不存在全局吞异常。
- `utils/formatters.ts` 故意混合日期、耗时、百分比、枚举文案、得分风险等级，被四个页面共同依赖。
- 全局配置分散在根 `.env(.example)`、`docker-compose.yml`、`frontend/.env.example`、`config/index.ts`、http 封装与 logger 中，新增配置必须多处同步。
- 练习会话的提交是跨 `practiceSessions` 与 `answerRecords` 的同一 IndexedDB 事务；草稿、正式记录、错题本视图、进度统计各自独立又彼此联动。

## 验证

- `npm run build`：TypeScript 严格模式 + Vite 构建通过。
- `node smoke-runner.mjs`：36 项端到端断言覆盖“逐题反馈 → 草稿持久化 → 中途离开 → 续答 → 未完成不计统计 → 整组原子提交 → 错题本最近原因 → 重练掌握且保留历史 → 进度统计 → 放弃草稿不留痕”。

## License

MIT
