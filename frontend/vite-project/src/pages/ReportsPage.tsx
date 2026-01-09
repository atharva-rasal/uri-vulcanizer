import { useCallback, useEffect, useMemo, useState } from "react";
import { type ChangeLog, getLogs } from "../api";

export default function ReportsPage() {
  const [logs, setLogs] = useState<ChangeLog[]>([]);

  // Filters
  const [actionFilter, setActionFilter] = useState<string>("all");
  const [userFilter, setUserFilter] = useState<string>("all");
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  // Get unique actions and users for dropdowns
  const actions = Array.from(new Set(logs.map((l) => l.action)));
  const users = Array.from(
    new Set(logs.map((l) => l.user).filter((u): u is string => Boolean(u)))
  );

  // Apply filters
  const applyFilters = useCallback(
    (data: ChangeLog[] = logs) => {
      let result = data;

      // Filter by action
      if (actionFilter !== "all") {
        result = result.filter((l) => l.action === actionFilter);
      }

      // Filter by user
      if (userFilter !== "all") {
        result = result.filter((l) => l.user === userFilter);
      }

      // Filter by date range
      if (dateFrom) {
        const from = new Date(dateFrom).getTime();
        result = result.filter((l) => new Date(l.timestamp).getTime() >= from);
      }

      if (dateTo) {
        const to = new Date(dateTo).getTime();
        result = result.filter((l) => new Date(l.timestamp).getTime() <= to);
      }

      return result;
    },
    [logs, actionFilter, userFilter, dateFrom, dateTo]
  );

  useEffect(() => {
    const fetchLogs = async () => {
      try {
        const data = await getLogs();
        setLogs(data);
      } catch (error) {
        console.error("Error loading logs:", error);
      }
    };
    fetchLogs();
  }, []);

  const filteredLogs = useMemo(() => applyFilters(), [applyFilters]);

  // Download as CSV
  const downloadCSV = () => {
    const headers = ["Timestamp", "User", "Action", "Details"];
    const rows = filteredLogs.map((log) => [
      new Date(log.timestamp).toLocaleString(),
      log.user || "System",
      log.action,
      JSON.stringify(log.details),
    ]);

    let csv = headers.join(",") + "\n";
    rows.forEach((row) => {
      csv += row.map((cell) => `"${cell}"`).join(",") + "\n";
    });

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reports_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Download as JSON
  const downloadJSON = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      totalRecords: filteredLogs.length,
      logs: filteredLogs,
    };

    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `reports_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Get action badge color
  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      "recipe-created": "bg-blue-100 text-blue-800",
      "recipe-updated": "bg-yellow-100 text-yellow-800",
      "recipe-deleted": "bg-red-100 text-red-800",
      "recipe-activated": "bg-green-100 text-green-800",
      "recipe-activation-failed": "bg-red-100 text-red-800",
    };
    return colors[action] || "bg-gray-100 text-gray-800";
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-4xl font-bold text-gray-800">
          System Reports & Audit Log
        </h1>
        <p className="text-gray-600 mt-2">
          Track all system changes and recipe activations
        </p>
      </div>

      {/* Filters Section */}
      <div className="bg-white shadow-md rounded-lg p-6 border-l-4 border-blue-500">
        <h2 className="text-lg font-semibold text-gray-800 mb-6 flex items-center">
          <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm">
            🔍
          </span>
          Filters
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {/* Action Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Action Type
            </label>
            <select
              value={actionFilter}
              onChange={(e) => setActionFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Actions</option>
              {actions.map((action) => (
                <option key={action} value={action}>
                  {action.replace(/-/g, " ").toUpperCase()}
                </option>
              ))}
            </select>
          </div>

          {/* User Filter */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              User
            </label>
            <select
              value={userFilter}
              onChange={(e) => setUserFilter(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Users</option>
              {users.map((user) => (
                <option key={user} value={user}>
                  {user}
                </option>
              ))}
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              From Date
            </label>
            <input
              type="datetime-local"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              To Date
            </label>
            <input
              type="datetime-local"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Reset & Download */}
        <div className="flex gap-2 justify-between flex-wrap">
          <button
            onClick={() => {
              setActionFilter("all");
              setUserFilter("all");
              setDateFrom("");
              setDateTo("");
            }}
            className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg font-semibold transition"
          >
            🔄 Reset Filters
          </button>

          <div className="flex gap-2">
            <button
              onClick={downloadCSV}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              📥 Download CSV
            </button>
            <button
              onClick={downloadJSON}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold transition"
            >
              📥 Download JSON
            </button>
          </div>
        </div>
      </div>

      {/* Results Info */}
      <div className="bg-indigo-50 border-l-4 border-indigo-500 p-4 rounded">
        <p className="text-indigo-800 font-semibold">
          📊 Showing{" "}
          <span className="text-indigo-600 font-bold">
            {filteredLogs.length}
          </span>{" "}
          of <span className="text-indigo-600 font-bold">{logs.length}</span>{" "}
          records
        </p>
      </div>

      {/* Logs Table */}
      <div className="bg-white shadow-md rounded-lg overflow-hidden">
        {filteredLogs.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-gray-600 text-lg">
              📭 No logs matching the selected filters
            </p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gradient-to-r from-blue-600 to-blue-700 text-white">
              <tr>
                <th className="p-4 text-left font-semibold">Timestamp</th>
                <th className="p-4 text-left font-semibold">User</th>
                <th className="p-4 text-left font-semibold">Action</th>
                <th className="p-4 text-center font-semibold">Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log, idx) => (
                <tr
                  key={log.id}
                  className={`border-b transition hover:bg-blue-50 cursor-pointer ${
                    idx % 2 === 0 ? "bg-white" : "bg-gray-50"
                  }`}
                >
                  <td className="p-4 text-gray-700 font-medium">
                    {new Date(log.timestamp).toLocaleString()}
                  </td>
                  <td className="p-4 text-gray-700">{log.user || "System"}</td>
                  <td className="p-4">
                    <span
                      className={`inline-block px-3 py-1 rounded-full text-sm font-semibold ${getActionColor(
                        log.action
                      )}`}
                    >
                      {log.action.replace(/-/g, " ")}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <button
                      onClick={() =>
                        setExpandedRow(expandedRow === log.id ? null : log.id)
                      }
                      className="text-blue-600 hover:text-blue-800 font-semibold"
                    >
                      {expandedRow === log.id ? "▼ Hide" : "▶ View"}
                    </button>
                  </td>
                </tr>
              ))}

              {/* Expanded Details Row */}
              {expandedRow !== null && (
                <tr className="bg-gray-100 border-b">
                  <td colSpan={4} className="p-4">
                    <div className="bg-white rounded-lg p-4 border-l-4 border-blue-500">
                      <h3 className="font-bold text-gray-800 mb-2">
                        Full Details:
                      </h3>
                      <pre className="text-xs bg-gray-100 p-3 rounded overflow-auto max-h-64">
                        {JSON.stringify(
                          filteredLogs.find((l) => l.id === expandedRow)
                            ?.details,
                          null,
                          2
                        )}
                      </pre>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
