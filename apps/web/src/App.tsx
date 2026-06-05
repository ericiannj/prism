import { Routes, Route } from "react-router-dom";
import { Nav } from "./components/Nav";
import { DocumentsPage } from "./pages/DocumentsPage";

export function App() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1">
        <Routes>
          <Route
            path="/"
            element={
              <div className="flex items-center justify-center h-full py-32">
                <h1 className="text-2xl font-semibold">Prism</h1>
              </div>
            }
          />
          <Route path="/documents" element={<DocumentsPage />} />
        </Routes>
      </main>
    </div>
  );
}
