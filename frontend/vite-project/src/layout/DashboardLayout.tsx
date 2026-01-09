/* eslint-disable @typescript-eslint/no-explicit-any */
import type { ReactNode } from "react";
import Sidebar from "../components/Sidebar";

interface DashboardLayoutProps {
  children: ReactNode;
  page: string;
  setPage: (p: string) => void;
}

export default function DashboardLayout({
  children,
  page,
  setPage,
}: DashboardLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-100 flex">
      <Sidebar page={page} setPage={setPage} />

      <main className="flex-1 p-8 space-y-8">{children}</main>
    </div>
  );
}
