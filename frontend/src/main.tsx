import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AuthProvider, AdminAuthProvider } from "@/context/AuthContext.tsx";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AdminAuthProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </AdminAuthProvider>
  </StrictMode>
);
