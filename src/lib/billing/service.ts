import "server-only";
import { getBillingConfig } from "./config";
import { MockBillingProvider } from "./mock-provider";
import { StripeBillingProvider } from "./stripe-provider";
import type { BillingProvider } from "./types";
export function billingProvider(): BillingProvider { return getBillingConfig().provider === "stripe" ? new StripeBillingProvider() : new MockBillingProvider(); }

