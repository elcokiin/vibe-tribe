import type { RouterClient } from "@orpc/server";

import { protectedProcedure, publicProcedure } from "./procedure.js";
import { profileRouter } from "./routers/profile.js";
import { todoRouter } from "./routers/todo.js";

export const appRouter = {
  healthCheck: publicProcedure.handler(() => {
    return "OK";
  }),
  privateData: protectedProcedure.handler(({ context }) => {
    return {
      message: "This is private",
      user: context.session?.user,
    };
  }),
  profile: profileRouter,
  todo: todoRouter,
};

export type AppRouter = typeof appRouter;
export type AppRouterClient = RouterClient<typeof appRouter>;
