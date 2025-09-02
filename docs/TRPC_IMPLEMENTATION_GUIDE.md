# Phase 1: tRPC Implementation Guide

## Quick Start Implementation

This guide provides step-by-step instructions to implement tRPC in your Portal app, integrated with your existing Better Auth setup.

## 1. Install Dependencies

```bash
# Core tRPC packages
pnpm add @trpc/server @trpc/client @trpc/react-query @trpc/next @tanstack/react-query@^5 superjson

# Dev dependencies
pnpm add -D @types/superjson

# Optional but recommended for better DX
pnpm add server-only
```

## 2. Create Server Directory Structure

```bash
# Create directories
mkdir -p server/api/routers
mkdir -p app/api/trpc/[trpc]
```

## 3. Set Up tRPC Context with Better Auth

Create `server/context.ts`:

```typescript
import { auth } from "@/lib/auth";
import { db } from "@/db/schema";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

export async function createContext(opts: FetchCreateContextFnOptions) {
  // Get Better Auth session
  const session = await auth.api.getSession({
    headers: opts.req.headers,
  });

  return {
    db,
    session,
    user: session?.user || null,
    headers: opts.req.headers,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
```

## 4. Create tRPC Instance with Procedures

Create `server/api/trpc.ts`:

```typescript
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "../context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
  errorFormatter({ shape }) {
    return shape;
  },
});

// Middleware to log all queries and mutations
const loggerMiddleware = t.middleware(async ({ path, type, next }) => {
  const start = Date.now();
  const result = await next();
  const durationMs = Date.now() - start;

  console.log(`[tRPC] ${type} ${path} - ${durationMs}ms`);

  return result;
});

export const router = t.router;
export const publicProcedure = t.procedure.use(loggerMiddleware);

// Protected procedure - requires authentication
export const protectedProcedure = t.procedure
  .use(loggerMiddleware)
  .use(({ ctx, next }) => {
    if (!ctx.session || !ctx.user) {
      throw new TRPCError({
        code: "UNAUTHORIZED",
        message: "You must be logged in to access this resource",
      });
    }
    return next({
      ctx: {
        ...ctx,
        session: ctx.session,
        user: ctx.user,
      },
    });
  });

// Admin procedure - requires admin role
export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "You must be an admin to access this resource",
    });
  }
  return next({ ctx });
});
```

## 5. Create Your First Router

Create `server/api/routers/user.ts`:

```typescript
import { z } from "zod";
import {
  router,
  publicProcedure,
  protectedProcedure,
  adminProcedure,
} from "../trpc";
import { TRPCError } from "@trpc/server";
import { eq } from "drizzle-orm";
import { user } from "@/db/schema";

export const userRouter = router({
  // Get current user
  me: protectedProcedure.query(({ ctx }) => {
    return ctx.user;
  }),

  // Get user by ID (admin only)
  getById: adminProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      const foundUser = await ctx.db.query.user.findFirst({
        where: eq(user.id, input.userId),
      });

      if (!foundUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      return foundUser;
    }),

  // Update user profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        image: z.string().url().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const updated = await ctx.db
        .update(user)
        .set({
          name: input.name,
          image: input.image,
          updatedAt: new Date(),
        })
        .where(eq(user.id, ctx.user.id))
        .returning();

      return updated[0];
    }),

  // List all users (admin only)
  list: adminProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(10),
        offset: z.number().min(0).default(0),
      }),
    )
    .query(async ({ ctx, input }) => {
      const users = await ctx.db.query.user.findMany({
        limit: input.limit,
        offset: input.offset,
      });

      return users;
    }),
});
```

## 6. Create Dashboard Router

Create `server/api/routers/dashboard.ts`:

```typescript
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

export const dashboardRouter = router({
  // Get dashboard stats
  getStats: protectedProcedure.query(async ({ ctx }) => {
    // Example stats - replace with your actual queries
    const [userCount, recentOrders, pendingTasks] = await Promise.all([
      ctx.db.query.user.findMany().then((users) => users.length),
      // Add your actual queries here
      Promise.resolve(0),
      Promise.resolve(0),
    ]);

    return {
      userCount,
      recentOrders,
      pendingTasks,
      lastUpdated: new Date(),
    };
  }),

  // Get activity feed
  getActivityFeed: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
      }),
    )
    .query(async ({ ctx, input }) => {
      // Replace with your actual activity query
      return {
        activities: [],
        hasMore: false,
      };
    }),
});
```

## 7. Create Root Router

Create `server/api/root.ts`:

```typescript
import { router } from "./trpc";
import { userRouter } from "./routers/user";
import { dashboardRouter } from "./routers/dashboard";

export const appRouter = router({
  user: userRouter,
  dashboard: dashboardRouter,
  // Add more routers as you create them
});

export type AppRouter = typeof appRouter;
```

## 8. Create tRPC API Handler

Create `app/api/trpc/[trpc]/route.ts`:

```typescript
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/api/root";
import { createContext } from "@/server/context";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext,
    onError:
      process.env.NODE_ENV === "development"
        ? ({ path, error }) => {
            console.error(
              `❌ tRPC failed on ${path ?? "<no-path>"}: ${error.message}`,
            );
          }
        : undefined,
  });

export { handler as GET, handler as POST };
```

## 9. Set Up tRPC Client

Create `lib/trpc/client.ts`:

```typescript
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "@/server/api/root";

export const trpc = createTRPCReact<AppRouter>();
```

## 10. Create tRPC Provider

Create `providers/trpc-provider.tsx`:

```typescript
"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { useState } from "react";
import superjson from "superjson";
import { trpc } from "@/lib/trpc/client";

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 1000,
            refetchInterval: 30 * 1000,
          },
        },
      })
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({
          enabled: (opts) =>
            process.env.NODE_ENV === "development" ||
            (opts.direction === "down" && opts.result instanceof Error),
        }),
        httpBatchLink({
          url: "/api/trpc",
          transformer: superjson,
        }),
      ],
    })
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

## 11. Update Root Layout

Update `app/layout.tsx`:

```typescript
import { TRPCProvider } from "@/providers/trpc-provider";
// ... other imports

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <TRPCProvider>
          <ThemeProvider>
            <SSEProvider>
              <Toaster />
              {children}
            </SSEProvider>
          </ThemeProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
```

## 12. Use tRPC in Components

Example usage in a component:

```typescript
"use client";

import { trpc } from "@/lib/trpc/client";

export function UserProfile() {
  const { data: user, isLoading, error } = trpc.user.me.useQuery();

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated!");
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!user) return <div>No user found</div>;

  return (
    <div>
      <h1>Welcome, {user.name}!</h1>
      <button
        onClick={() => {
          updateProfile.mutate({
            name: "New Name",
          });
        }}
      >
        Update Name
      </button>
    </div>
  );
}
```

## 13. Type-Safe API Calls from Server Components

For server components, create `lib/trpc/server.ts`:

```typescript
import "server-only";

import { createCaller } from "@/server/api/root";
import { createContext } from "@/server/context";
import { headers } from "next/headers";

export async function serverTrpc() {
  const context = await createContext({
    req: {
      headers: headers(),
    } as any,
  });

  return createCaller(context);
}
```

Update `server/api/root.ts` to export createCaller:

```typescript
// ... existing code

export const createCaller = appRouter.createCaller;
```

Use in server components:

```typescript
import { serverTrpc } from "@/lib/trpc/server";

export default async function DashboardPage() {
  const trpc = await serverTrpc();
  const stats = await trpc.dashboard.getStats();

  return (
    <div>
      <h1>Dashboard</h1>
      <div>Total Users: {stats.userCount}</div>
    </div>
  );
}
```

## 14. Integration with Existing SSE System

You can trigger SSE events from tRPC mutations:

```typescript
// In your router
import { broadcastRealtimeEvent } from "@/helpers/realtime-broadcast";

export const inventoryRouter = router({
  updateStock: protectedProcedure
    .input(
      z.object({
        itemId: z.string(),
        quantity: z.number(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Update database
      const updated = await updateInventoryInDb(input);

      // Broadcast via SSE
      await broadcastRealtimeEvent("inventory-updated", {
        itemId: input.itemId,
        quantity: input.quantity,
        updatedBy: ctx.user.email,
      });

      return updated;
    }),
});
```

## 15. Error Handling Best Practices

Create `lib/trpc/errors.ts`:

```typescript
import { TRPCError } from "@trpc/server";

export function handleDatabaseError(error: unknown): never {
  console.error("Database error:", error);

  if (error instanceof Error) {
    if (error.message.includes("UNIQUE constraint")) {
      throw new TRPCError({
        code: "CONFLICT",
        message: "This record already exists",
      });
    }
  }

  throw new TRPCError({
    code: "INTERNAL_SERVER_ERROR",
    message: "An unexpected error occurred",
  });
}

export function requirePermission(
  hasPermission: boolean,
  message = "You don't have permission to perform this action",
): void {
  if (!hasPermission) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message,
    });
  }
}
```

## Next Steps

1. **Add More Routers**: Create routers for inventory, job cards, orders, etc.
2. **Implement Optimistic Updates**: Use tRPC's optimistic updates for better UX
3. **Add Input Validation**: Use Zod schemas for comprehensive validation
4. **Set Up Testing**: Add integration tests for your tRPC procedures
5. **Monitor Performance**: Use tRPC's built-in logging and add custom metrics

## Common Patterns

### Pagination Pattern

```typescript
const paginationInput = z.object({
  cursor: z.string().optional(),
  limit: z.number().min(1).max(100).default(20),
});

list: protectedProcedure
  .input(paginationInput)
  .query(async ({ ctx, input }) => {
    const items = await ctx.db.query.items.findMany({
      limit: input.limit + 1,
      cursor: input.cursor ? { id: input.cursor } : undefined,
    });

    let nextCursor: string | undefined = undefined;
    if (items.length > input.limit) {
      const nextItem = items.pop();
      nextCursor = nextItem!.id;
    }

    return {
      items,
      nextCursor,
    };
  });
```

### Batch Operations Pattern

```typescript
batchUpdate: adminProcedure
  .input(
    z.object({
      updates: z.array(
        z.object({
          id: z.string(),
          data: z.object({
            // your update fields
          }),
        }),
      ),
    }),
  )
  .mutation(async ({ ctx, input }) => {
    const results = await ctx.db.transaction(async (tx) => {
      return Promise.all(
        input.updates.map((update) =>
          tx
            .update(table)
            .set(update.data)
            .where(eq(table.id, update.id))
            .returning(),
        ),
      );
    });

    return results.flat();
  });
```

This completes the basic tRPC setup. You now have a type-safe API layer integrated with your Better Auth system!
