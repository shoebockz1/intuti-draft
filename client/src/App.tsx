import { AppProvider, useApp } from "./context/AppContext";
import SetupScreen from "./components/setup/SetupScreen";
import DraftScreen from "./components/draft/DraftScreen";
import Toast from "./components/common/Toast";

function Screens() {
  const { screen } = useApp();
  return (
    <div id="app">
      {screen === "setup" && <SetupScreen />}
      {screen === "draft" && <DraftScreen />}
      <Toast />
    </div>
  );
}

function App() {
  return (
    <AppProvider>
      <Screens />
    </AppProvider>
  );
}

export default App;
