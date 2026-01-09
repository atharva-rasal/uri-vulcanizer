import { useEffect, useState } from "react";
import io from "socket.io-client";

import LiveChart from "../components/LiveChart";
import ValueCard from "../components/ValueCard";

type ChartPoint = {
  time: number;
  temperature?: number;
  pressure?: number;
};

const socket = io("http://localhost:3000");

interface LiveData {
  temperature: number;
  pressure: number;
  timestamp?: string | number;
}

export default function LiveDashboardPage() {
  const [liveData, setLiveData] = useState<LiveData | null>(null);
  const [liveChartTemp, setLiveChartTemp] = useState<ChartPoint[]>([]);
  const [liveChartPressure, setLiveChartPressure] = useState<ChartPoint[]>([]);

  useEffect(() => {
    const handler = (data: LiveData) => {
      setLiveData(data);

      setLiveChartTemp((prev) => {
        const updated = [
          ...prev,
          { time: Date.now(), temperature: data.temperature },
        ];
        if (updated.length > 60) updated.shift();
        return updated;
      });

      setLiveChartPressure((prev) => {
        const updated = [
          ...prev,
          { time: Date.now(), pressure: data.pressure },
        ];
        if (updated.length > 60) updated.shift();
        return updated;
      });
    };

    socket.on("live-data", handler);
    return () => {
      socket.off("live-data", handler);
    };
  }, []);

  return (
    <>
      <h2 className="text-3xl font-semibold mb-6 text-gray-800">
        Live Dashboard
      </h2>

      {/* Value Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ValueCard
          label="Temperature"
          value={liveData?.temperature}
          unit="°C"
        />
        <ValueCard label="Pressure" value={liveData?.pressure} unit="PSI" />
      </div>

      {/* Charts */}
      <div className="space-y-6">
        <LiveChart
          title="Live Temperature Chart"
          data={liveChartTemp}
          dataKey="temperature"
          color="#ef4444"
        />

        <LiveChart
          title="Live Pressure Chart"
          data={liveChartPressure}
          dataKey="pressure"
          color="#3b82f6"
        />
      </div>
    </>
  );
}
