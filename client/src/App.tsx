import { AppProvider } from "./context/AppContext";
import { RouterProvider, useRouter } from "./router/Router";
import BoardRoute from "./routes/BoardRoute";
import AdminRoute from "./routes/AdminRoute";
import FreeAgentsRoute from "./routes/FreeAgentsRoute";
import BoardOnlyRoute from "./routes/BoardOnlyRoute";
import RostersRoute from "./routes/RostersRoute";
import Toast from "./components/common/Toast";
import VersionBadge from "./components/common/VersionBadge";
import WhoAmIModal from "./components/modals/WhoAmIModal";

// Unknown paths fall through to the board, matching the server SPA fallback
// (any non-API GET serves index.html) — a mistyped URL shows the draft rather
// than a blank screen.
function renderRoute(path: string) {
  switch (path) {
    case "/admin":
      return <AdminRoute />;
    case "/players":
      return <FreeAgentsRoute />;
    case "/boardonly":
      return <BoardOnlyRoute />;
    case "/rosters":
      return <RostersRoute />;
    default:
      return <BoardRoute />;
  }
}

function Screens() {
  const { path } = useRouter();
  return (
    <div id="app">
      {renderRoute(path)}
      <Toast />
      <VersionBadge />
      {/* App-level, not inside DraftScreen: the "who are you?" trigger fires
          on any route, so when it lived in DraftScreen alone, opening
          /players in a fresh tab set whoAmIOpen with nothing rendering it —
          and the modal then appeared unprompted on a later navigation to "/". */}
      <WhoAmIModal />
    </div>
  );
}

function App() {
  return (
    <RouterProvider>
      <AppProvider>
        <Screens />
      </AppProvider>
    </RouterProvider>
  );
}

export default App;
