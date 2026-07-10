import { AppProvider } from "./context/AppContext";
import { RouterProvider, useRouter } from "./router/Router";
import BoardRoute from "./routes/BoardRoute";
import AdminRoute from "./routes/AdminRoute";
import FreeAgentsRoute from "./routes/FreeAgentsRoute";
import Toast from "./components/common/Toast";
import VersionBadge from "./components/common/VersionBadge";

function Screens() {
  const { path } = useRouter();
  return (
    <div id="app">
      {path === "/admin" ? <AdminRoute /> : path === "/players" ? <FreeAgentsRoute /> : <BoardRoute />}
      <Toast />
      <VersionBadge />
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
