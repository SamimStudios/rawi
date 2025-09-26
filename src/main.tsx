import { createRoot } from "react-dom/client";
import MainApp from "./App.tsx";
import { DraftsProvider } from "./contexts/DraftsContext.tsx";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <DraftsProvider>
    <MainApp />
  </DraftsProvider>
);
