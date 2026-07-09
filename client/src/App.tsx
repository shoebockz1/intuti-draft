import { AppProvider } from "./context/AppContext";
import { RouterProvider, useRouter } from "./router/Router";
import BoardRoute from "./routes/BoardRoute";
import AdminRoute from "./routes/AdminRoute";
import Toast from "./components/common/Toast";

function Screens() {
  const { path } = useRouter();
  return (
    <div id="app">
      {path === "/admin" ? <AdminRoute /> : <BoardRoute />}
      <Toast />
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
