import { useEffect, useState } from "react";
import LiveChart from "../components/LiveChart";

type ChartPoint = {
  time: number;
  temperature?: number;
  pressure?: number;
};

interface Reading {
  id: number;
  temperature: number;
  pressure: number;
  timestamp: string;
}

export default function HistoryPage() {
  const [historyData, setHistoryData] = useState<Reading[]>([]);
  const [chartTempData, setChartTempData] = useState<ChartPoint[]>([]);
  const [chartPressureData, setChartPressureData] = useState<ChartPoint[]>([]);
  const [loading, setLoading] = useState(false);

  // Default to last 24 hours
  const [fromDate, setFromDate] = useState(() => {
    const date = new Date();
    date.setHours(date.getHours() - 24);
    return date.toISOString().slice(0, 16);
  });

  const [toDate, setToDate] = useState(() => {
    return new Date().toISOString().slice(0, 16);
  });

  const fetchHistory = async (from: string, to: string) => {
    setLoading(true);
    try {
      const response = await fetch(
        `http://localhost:3000/api/history?from=${encodeURIComponent(
          from
        )}&to=${encodeURIComponent(to)}`
      );
      const data = await response.json();

      setHistoryData(data);

      // Transform data for charts
      const tempPoints: ChartPoint[] = data.map((reading: Reading) => ({
        time: new Date(reading.timestamp).getTime(),
        temperature: reading.temperature,
      }));

      const pressurePoints: ChartPoint[] = data.map((reading: Reading) => ({
        time: new Date(reading.timestamp).getTime(),
        pressure: reading.pressure,
      }));

      setChartTempData(tempPoints);
      setChartPressureData(pressurePoints);
    } catch (error) {
      console.error("Error fetching history:", error);
    } finally {
      setLoading(false);
    }
  };

  // Load initial data
  useEffect(() => {
    fetchHistory(fromDate, toDate);
  }, [fromDate, toDate]);

  const handleApplyFilter = () => {
    if (fromDate && toDate) {
      fetchHistory(fromDate, toDate);
    }
  };

  const handleQuickFilter = (hours: number) => {
    const from = new Date();
    from.setHours(from.getHours() - hours);
    const to = new Date();

    setFromDate(from.toISOString().slice(0, 16));
    setToDate(to.toISOString().slice(0, 16));

    fetchHistory(from.toISOString(), to.toISOString());
  };

  return (
    <>
      <h2 className="text-3xl font-semibold mb-6 text-gray-800">History</h2>

      {/* Filter Bar - Matching RecipeForm Theme */}
      <div className="bg-white shadow-md rounded-lg p-6 mb-6 border-l-4 border-blue-500">
        <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center">
          <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center mr-2 text-sm">
            📅
          </span>
          Filter by Date & Time
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          {/* From Date-Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              From <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* To Date-Time */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              To <span className="text-red-500">*</span>
            </label>
            <input
              type="datetime-local"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Apply Button */}
          <button
            onClick={handleApplyFilter}
            disabled={loading}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 font-semibold transition-colors"
          >
            {loading ? "Loading..." : "Apply"}
          </button>

          {/* Refresh Button */}
          <button
            onClick={() => handleApplyFilter()}
            className="bg-gray-200 text-gray-700 px-6 py-2 rounded-lg hover:bg-gray-300 font-semibold transition-colors"
          >
            Refresh
          </button>
        </div>

        {/* Quick Filters */}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="text-sm font-medium text-gray-600 mr-2">
            Quick filters:
          </span>
          <button
            onClick={() => handleQuickFilter(1)}
            className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm hover:bg-indigo-200 font-medium transition-colors"
          >
            Last 1h
          </button>
          <button
            onClick={() => handleQuickFilter(6)}
            className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm hover:bg-indigo-200 font-medium transition-colors"
          >
            Last 6h
          </button>
          <button
            onClick={() => handleQuickFilter(24)}
            className="bg-indigo-100 text-indigo-700 px-3 py-1 rounded-full text-sm hover:bg-indigo-200 font-medium transition-colors"
          >
            Last 24h
          </button>
        </div>

        {/* Data count info */}
        {historyData.length > 0 && (
          <p className="text-sm text-gray-600 mt-4 font-medium">
            📊 Showing{" "}
            <span className="text-blue-600 font-semibold">
              {historyData.length}
            </span>{" "}
            readings
          </p>
        )}
      </div>

      {/* Charts */}
      {chartTempData.length > 0 ? (
        <div className="space-y-6">
          <LiveChart
            title="Historical Temperature"
            data={chartTempData}
            dataKey="temperature"
            color="#ef4444"
          />

          <LiveChart
            title="Historical Pressure"
            data={chartPressureData}
            dataKey="pressure"
            color="#3b82f6"
          />
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-8 text-center border-l-4 border-gray-300">
          <p className="text-gray-600 text-lg">
            {loading
              ? "⏳ Loading historical data..."
              : "📭 No data available for the selected period"}
          </p>
        </div>
      )}
    </>
  );
}
