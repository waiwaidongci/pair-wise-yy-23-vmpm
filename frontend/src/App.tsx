import { BrowserRouter, NavLink, Navigate, Route, Routes } from "react-router-dom";
import { routes, DEFAULT_ROUTE } from "./router/routes";
import { useIndexedDbStore } from "./hooks/useIndexedDbStore";
import { APP_CONFIG } from "./config";

function BootScreen({ state, error, onRetry }: { state: "booting" | "ready" | "error"; error: string | null; onRetry: () => void }) {
  if (state === "ready") return null;
  return (
    <div className="boot-screen">
      <div className="boot-card">
        {state === "booting" ? (
          <>
            <div className="boot-spinner" />
            <h1>盲文点字学习训练器</h1>
            <p>正在初始化本地 IndexedDB 学习数据…</p>
          </>
        ) : (
          <>
            <h1>本地数据启动失败</h1>
            <p className="boot-error">{error}</p>
            <button type="button" className="btn btn--primary" onClick={onRetry}>
              重试
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function App() {
  const boot = useIndexedDbStore();
  return (
    <BrowserRouter>
      <BootScreen state={boot.state} error={boot.error} onRetry={boot.reload} />
      <div className="shell">
        <aside className="sidebar">
          <div className="brand">
            <span className="brand__dots" aria-hidden>⠃</span>
            <div>
              <div className="brand__name">盲文点字学习训练器</div>
              <div className="brand__sub">braille-trainer · {APP_CONFIG.version}</div>
            </div>
          </div>
          <nav className="nav">
            {routes.map((route) => (
              <NavLink
                key={route.route}
                to={route.route}
                className={({ isActive }) => `nav__item ${isActive ? "nav__item--active" : ""}`}
              >
                {route.name}
              </NavLink>
            ))}
          </nav>
          <p className="sidebar__foot">数据仅保存在本机浏览器 IndexedDB</p>
        </aside>
        <main className="content">
          <Routes>
            {routes.map((route) => {
              const Page = route.component;
              return <Route key={route.route} path={route.route} element={<Page />} />;
            })}
            <Route path="*" element={<Navigate to={DEFAULT_ROUTE} replace />} />
          </Routes>
        </main>
      </div>
    </BrowserRouter>
  );
}
