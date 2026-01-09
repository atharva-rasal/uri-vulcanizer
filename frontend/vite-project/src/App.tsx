import { useState } from "react";
import DashboardLayout from "./layout/DashboardLayout";
import type { RecipeFormData } from "./pages/RecipeForm";
import { PageContext } from "./PageContext";

// Pages
import LiveDashboardPage from "./pages/LiveDashboardPage";
import HistoryPage from "./pages/HistoryPage";
import RecipesPage from "./pages/RecipePage";
import ReportsPage from "./pages/ReportsPage";
import RecipeForm from "./pages/RecipeForm";

export default function App() {
  const [page, setPage] = useState("live");

  const handleRecipeSubmit = (data: RecipeFormData) => {
    // Handle recipe form submission
    console.log("Recipe submitted:", data);
    setPage("recipes");
  };

  return (
    <PageContext.Provider value={{ setPage }}>
      <DashboardLayout page={page} setPage={setPage}>
        {page === "live" && <LiveDashboardPage />}
        {page === "history" && <HistoryPage />}
        {page === "recipes" && <RecipesPage />}
        {page === "reports" && <ReportsPage />}
        {page === "recipe-form" && <RecipeForm onSubmit={handleRecipeSubmit} />}
      </DashboardLayout>
    </PageContext.Provider>
  );
}
