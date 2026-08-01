"use client";

import { DashboardNav } from "./dashboard-nav";
import { useLocalSession } from "@/components/session/local-session-provider";

export function DashboardShell({ children, cloud, identity }: { children: React.ReactNode; cloud: boolean; identity?: { email: string; displayName: string } }) { const { user } = useLocalSession(); const current = identity ?? { email: user.email, displayName: `${user.firstName} ${user.lastName}`.trim() }; return <div className="min-h-screen bg-background"><DashboardNav email={current.email} displayName={current.displayName} cloud={cloud} /><div className="lg:ml-64">{children}</div></div>; }
