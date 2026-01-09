/* eslint-disable @typescript-eslint/no-explicit-any */
interface SidebarProps {
  page: string;
  setPage: (p: string) => void;
}

export default function Sidebar({ page, setPage }: SidebarProps) {
  const btn = (p: string, label: string) => (
    <button
      onClick={() => setPage(p)}
      className={`w-full text-left text-lg font-medium p-2 rounded 
        ${page === p ? "bg-blue-600 text-white" : "hover:bg-gray-200"}`}
    >
      {label}
    </button>
  );

  return (
    <aside className="w-64 bg-white shadow p-5">
      <h1 className="text-2xl font-bold mb-6">Vulcanizer</h1>

      <nav className="space-y-3">
        {btn("live", "Live Dashboard")}
        {btn("history", "History")}
        {btn("recipes", "Recipes")}
        {btn("reports", "Reports")}
        {btn("recipe-form", "Recipe Form")}
      </nav>
    </aside>
  );
}
