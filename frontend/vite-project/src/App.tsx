/* eslint-disable @typescript-eslint/no-explicit-any */
import { useEffect, useState } from "react";
// import axios from "axios";
import io from "socket.io-client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const socket = io("http://localhost:3000");

export default function App() {
  const [liveData, setLiveData] = useState<any>(null);
  const [liveChartTemp, setLiveChartTemp] = useState<
    { time: number; temperature: number }[]
  >([]);
  const [liveChartPressure, setLiveChartPressure] = useState<
    { time: number; pressure: number }[]
  >([]);

  // Receive Live Data
  useEffect(() => {
    const handler = (data: any) => {
      setLiveData(data);

      // Temperature live chart
      setLiveChartTemp((prev) => {
        const newPoint = {
          time: Date.now(),
          temperature: data.temperature,
        };
        const updated = [...prev, newPoint];
        if (updated.length > 60) updated.shift();
        return updated;
      });

      // Pressure live chart
      setLiveChartPressure((prev) => {
        const newPoint = {
          time: Date.now(),
          pressure: data.pressure,
        };
        const updated = [...prev, newPoint];
        if (updated.length > 60) updated.shift();
        return updated;
      });
    };

    socket.on("live-data", handler);

    // Cleanup to remove listener
    return () => {
      socket.off("live-data", handler);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex">
      {/* SIDEBAR */}
      <aside className="w-64 bg-white shadow p-5">
        <h1 className="text-2xl font-bold mb-6">Vulcanizer</h1>

        <nav className="space-y-3">
          <button className="w-full text-left text-lg font-medium">
            Live Dashboard
          </button>
          <button className="w-full text-left text-lg font-medium">
            History
          </button>
          <button className="w-full text-left text-lg font-medium">
            Settings
          </button>
        </nav>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 p-8 space-y-8">
        <h2 className="text-3xl font-semibold">Live Dashboard</h2>

        {/* LIVE VALUE CARDS */}
        <div className="grid grid-cols-2 gap-6">
          <div className="bg-white shadow rounded p-6">
            <h3 className="text-xl font-semibold">Temperature</h3>
            <p className="text-4xl font-bold mt-4">
              {liveData?.temperature ?? "--"}
            </p>
          </div>

          <div className="bg-white shadow rounded p-6">
            <h3 className="text-xl font-semibold">Pressure</h3>
            <p className="text-4xl font-bold mt-4">
              {liveData?.pressure ?? "--"}
            </p>
          </div>
        </div>

        {/* FILTER BAR */}
        <div className="bg-white shadow rounded p-4 flex items-center gap-4">
          <p className="font-semibold">Filter:</p>
          <select className="border p-2 rounded">
            <option>Last 1 min</option>
            <option>Last 5 min</option>
            <option>Last 10 min</option>
          </select>

          <button className="bg-blue-600 text-white px-4 py-2 rounded">
            Apply
          </button>
        </div>

        {/* LIVE TEMPERATURE CHART */}
        <div className="bg-white shadow rounded p-6 h-[350px]">
          <h3 className="text-xl font-semibold mb-4">Live Temperature Chart</h3>

          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={liveChartTemp}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tickFormatter={(t) => new Date(t).toLocaleTimeString()}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(t) => new Date(t).toLocaleTimeString()}
              />
              <Line
                type="monotone"
                dataKey="temperature"
                stroke="#ef4444"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* LIVE PRESSURE CHART */}
        <div className="bg-white shadow rounded p-6 h-[350px]">
          <h3 className="text-xl font-semibold mb-4">Live Pressure Chart</h3>

          <ResponsiveContainer width="100%" height="85%">
            <LineChart data={liveChartPressure}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="time"
                tickFormatter={(t) => new Date(t).toLocaleTimeString()}
              />
              <YAxis />
              <Tooltip
                labelFormatter={(t) => new Date(t).toLocaleTimeString()}
              />
              <Line
                type="monotone"
                dataKey="pressure"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </main>
    </div>
  );
}
