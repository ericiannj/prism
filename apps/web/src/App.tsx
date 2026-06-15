import { Routes, Route } from "react-router-dom";
import { Nav } from "./components/Nav";
import { ErrorBoundary } from "./components/ErrorBoundary";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { HomePage } from "./pages/HomePage";
import { DocumentsPage } from "./pages/DocumentsPage";
import { ChatPage } from "./pages/ChatPage";
import { LoginPage } from "./pages/LoginPage";
import { RegisterPage } from "./pages/RegisterPage";
import { ChangePasswordPage } from "./pages/ChangePasswordPage";

export function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <ErrorBoundary>
                <HomePage />
              </ErrorBoundary>
            }
          />
          <Route
            path="/login"
            element={
              <ErrorBoundary>
                <LoginPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="/register"
            element={
              <ErrorBoundary>
                <RegisterPage />
              </ErrorBoundary>
            }
          />
          <Route
            path="/documents"
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <DocumentsPage />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/chat"
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <ChatPage />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ErrorBoundary>
                  <ChangePasswordPage />
                </ErrorBoundary>
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
    </div>
  );
}
