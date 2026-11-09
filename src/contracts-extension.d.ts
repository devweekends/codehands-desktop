import "@codehands/contracts";

declare module "@codehands/contracts" {
  export interface AuthResult {
    name?: string;
    email?: string;
    avatarUrl?: string;
  }
}
