import { createRoot } from "react-dom/client";
import { createTheme, CssBaseline, ThemeProvider } from "@mui/material";
import { routes } from "./router/routes";
import { useHashRoute } from "./hooks/useHashRoute";
import { LearnPage } from "./pages/LearnPage";
import { PracticePage } from "./pages/PracticePage";
import { MistakesPage } from "./pages/MistakesPage";
import { ProgressPage } from "./pages/ProgressPage";
import { usePracticeStore } from "./stores/PracticeDraftStore";
import "./styles.css";

// MUI 主题：主色沿用训练器墨绿；业务样式仍由 styles.css 提供。
const theme = createTheme({
  palette: { primary: { main: "#2f5d43" }, secondary: { main: "#d39b46" } },
  typography: { fontFamily: '"Aptos","PingFang SC",system-ui,sans-serif' }
});

function AppShell() {
  const fallback = routes[0]?.route ?? "/learn";
  const { route, navigate } = useHashRoute(fallback);
  const current = routes.find((item) => item.route === route) ?? routes[0];
  const practice = usePracticeStore();

  const goPracticeForLesson = (lessonId: number) => {
    navigate("/practice");
    // 学习页“去练习这节课”：默认看形辨字，由练习页继续当前草稿或开新组。
    void practice.start(lessonId, "CELL_TO_TEXT");
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <div className="shell">
        <aside>
          <div className="brand">盲文点字学习训练器</div>
          <nav>
            {routes.map((item) => (
              <button key={item.route} className={current?.route === item.route ? "active" : ""} onClick={() => navigate(item.route)}>
                {item.name}
              </button>
            ))}
          </nav>
          {practice.draft && (
            <div className="draft-hint">
              <span className="dot" />
              有一组未完成练习，可随时回到练习模式续答
            </div>
          )}
        </aside>
        <main className="page">
          {current?.route === "/learn" && <LearnPage onPracticeLesson={goPracticeForLesson} />}
          {current?.route === "/practice" && <PracticePage />}
          {current?.route === "/mistakes" && <MistakesPage onNavigatePractice={() => navigate("/practice")} />}
          {current?.route === "/progress" && <ProgressPage />}
        </main>
      </div>
    </ThemeProvider>
  );
}

function App() {
  return <AppShell />;
}

createRoot(document.getElementById("root")!).render(<App />);
