import type { TUser } from "@/users";
import type { QueryClient } from "@tanstack/react-query";

export interface IRouteContext {
    user: TUser | null;
    queryClient: QueryClient;
}
