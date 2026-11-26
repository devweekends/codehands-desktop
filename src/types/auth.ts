import type { AuthResult as ContractAuthResult } from "@codehands/contracts";

/**
 * The cloud server this app talks to also returns a name and an email, which the shared contract does not list yet.
 * Types only: nothing here exists at runtime. Remove it once the contract includes these fields.
 */
export type AuthResult = ContractAuthResult & { name?: string; email?: string };
