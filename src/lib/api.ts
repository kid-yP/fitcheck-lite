// Convex function references. Using `anyApi` means the app compiles without
// running codegen first; Convex still validates every call on the server.
import { anyApi } from "convex/server";

export const api = anyApi;
