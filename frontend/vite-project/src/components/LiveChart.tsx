/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

interface ChartPoint {
  time: number;
  [key: string]: number | string | undefined;
}

interface LiveChartProps {
  title: string;
  data: ChartPoint[];
  dataKey: string;
  color: string;
}

export default function LiveChart({
  title,
  data,
  dataKey,
  color,
}: LiveChartProps) {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 h-[350px] border-l-4 border-blue-500">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">{title}</h3>

      <ResponsiveContainer width="100%" height="85%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis
            dataKey="time"
            tickFormatter={(t) => new Date(t).toLocaleTimeString()}
            stroke="#6b7280"
          />
          <YAxis stroke="#6b7280" />
          <Tooltip
            labelFormatter={(t) => new Date(t).toLocaleTimeString()}
            contentStyle={{
              backgroundColor: "#fff",
              border: "1px solid #e5e7eb",
              borderRadius: "0.5rem",
            }}
          />
          <Line
            type="monotone"
            dataKey={dataKey}
            stroke={color}
            strokeWidth={2}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
