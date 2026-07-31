"use client";

import { useSyncExternalStore } from "react";
import { getRepositories } from "./config";

const subscribe = () => () => undefined;
export function useBrowserReady() { return useSyncExternalStore(subscribe, () => true, () => false); }
export function useRepositories() { return useBrowserReady() ? getRepositories() : null; }
