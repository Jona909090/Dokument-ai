"use client";

import { DashboardNav } from "./dashboard-nav";
import { useLocalSession } from "@/components/session/local-session-provider";

export function DashboardShell({ children }: { children: React.ReactNode }) { const { user } = useLocalSession(); return <div className="min-h-screen bg-background"><DashboardNav email={user.email} /><div className="lg:ml-64">{children}</div></div>; }
