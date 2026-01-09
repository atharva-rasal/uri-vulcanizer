import { useContext, useEffect, useState } from "react";
import { PageContext } from "../PageContext";
import {
  getRecipes,
  createRecipe,
  updateRecipe,
  deleteRecipe,
  type Recipe,
} from "../api";
import Modal from "../components/Modal";
import RecipeForm from "./RecipeForm";

export default function RecipesPage() {
  const pageCtx = useContext(PageContext);
  const setPage = pageCtx?.setPage;
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Recipe | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const load = async () => {
    const allRecipes = await getRecipes();
    setRecipes(allRecipes);
  };

  useEffect(() => {
    (async () => {
      await load();
    })();
    // Poll every 10 seconds to update status
    const interval = setInterval(load, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleSave = async (data: Recipe) => {
    try {
      if (editing && editing.id) {
        await updateRecipe(editing.id, data);
      } else {
        await createRecipe(data);
      }
      setOpen(false);
      setEditing(null);
      await load();
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      alert("Error saving recipe: " + msg);
    }
  };

  const handleDelete = async (id: number | undefined) => {
    if (
      confirm(
        "Are you sure you want to delete this recipe? This action cannot be undone."
      )
    ) {
      try {
        if (typeof id === "number") await deleteRecipe(id);
        load();
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        alert("Error deleting recipe: " + msg);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const badges: Record<string, { bg: string; text: string; icon: string }> = {
      pending: { bg: "bg-yellow-100", text: "text-yellow-800", icon: "⏱" },
      activated: { bg: "bg-green-100", text: "text-green-800", icon: "✓" },
      expired: { bg: "bg-red-100", text: "text-red-800", icon: "✕" },
    };
    const badge = badges[status] || badges.pending;
    return (
      <span
        className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold ${badge.bg} ${badge.text}`}
      >
        {badge.icon} {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  const filteredRecipes =
    filterStatus === "all"
      ? recipes
      : recipes.filter((r) => (r.status ?? "pending") === filterStatus);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">
            Recipe Management
          </h1>
          <p className="text-gray-600 mt-2">
            Manage and schedule vulcanizer recipes
          </p>
        </div>
        <button
          className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-6 py-3 rounded-lg shadow-md transition transform hover:scale-105"
          onClick={() => setPage && setPage("recipe-form")}
        >
          + New Recipe
        </button>
      </div>

      {/* Filters - Matching theme */}
      <div className="bg-white shadow-md rounded-lg p-6 border-l-4 border-blue-500">
        <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm">
            🔍
          </span>
          Filter by Status
        </h2>
        <div className="flex flex-wrap gap-2">
          {["all", "pending", "activated", "expired"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              className={`px-4 py-2 rounded-lg font-semibold transition ${
                filterStatus === status
                  ? "bg-blue-600 text-white shadow-md"
                  : "bg-indigo-100 text-indigo-700 hover:bg-indigo-200"
              }`}
            >
              {status === "all"
                ? "All Recipes"
                : status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Recipes Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {filteredRecipes.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 text-lg mb-4">📭 No recipes found</p>
            <button
              onClick={() => setPage && setPage("recipe-form")}
              className="text-blue-600 hover:text-blue-700 font-semibold underline"
            >
              Create your first recipe
            </button>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <tr>
                <th className="p-4 text-left font-semibold">Recipe Name</th>
                <th className="p-4 text-left font-semibold">Status</th>
                <th className="p-4 text-left font-semibold">
                  Scheduled Activation
                </th>
                <th className="p-4 text-left font-semibold">Created Date</th>
                <th className="p-4 text-center font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecipes.map((recipe, idx) => (
                <tr
                  key={recipe.id}
                  className={`border-b transition hover:bg-blue-50 ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <td className="p-4 font-semibold text-gray-800">
                    {recipe.name}
                  </td>
                  <td className="p-4">
                    {getStatusBadge(recipe.status ?? "pending")}
                  </td>
                  <td className="p-4 text-gray-600">
                    {recipe.scheduledAt
                      ? new Date(recipe.scheduledAt).toLocaleString()
                      : "Not scheduled"}
                  </td>
                  <td className="p-4 text-gray-600">
                    {recipe.createdAt
                      ? new Date(recipe.createdAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td className="p-4 flex gap-2 justify-center">
                    <button
                      className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition"
                      onClick={() => {
                        setEditing({ ...recipe });
                        setOpen(true);
                      }}
                    >
                      ✏️ Edit
                    </button>
                    <button
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded-lg text-sm font-medium transition"
                      onClick={() => handleDelete(recipe.id)}
                    >
                      🗑️ Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal for editing */}
      <Modal open={open} onClose={() => setOpen(false)}>
        <RecipeForm
          initial={
            editing
              ? { ...editing, scheduledAt: editing.scheduledAt ?? undefined }
              : undefined
          }
          onSubmit={handleSave}
        />
      </Modal>
    </div>
  );
}
