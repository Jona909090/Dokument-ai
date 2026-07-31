"use client";

import { createContext, useContext, useMemo } from "react";
import { demoUser } from "@/lib/data/demo-data";
import type { User } from "@/lib/data/models";

type SessionValue = { user: User; isDemo: true; isAuthenticated: true };
const LocalSessionContext = createContext<SessionValue | null>(null);

export function LocalSessionProvider({ children }: { children: React.ReactNode }) { const value = useMemo<SessionValue>(() => ({ user: demoUser, isDemo: true, isAuthenticated: true }), []); return <LocalSessionContext.Provider value={value}>{children}</LocalSessionContext.Provider>; }
export function useLocalSession() { const context = useContext(LocalSessionContext); if (!context) throw new Error("useLocalSession mora biti unutar LocalSessionProvidera."); return context; }
