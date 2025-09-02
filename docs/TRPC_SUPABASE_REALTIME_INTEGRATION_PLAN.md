# tRPC & Supabase Realtime Integration Plan for Portal App

## Executive Summary

This document outlines a comprehensive plan to integrate tRPC for type-safe API communication and Supabase Realtime for enhanced real-time collaborative features in the Portal app. The integration will complement the existing SSE infrastructure while providing additional capabilities for complex real-time scenarios.

## Current Architecture Analysis

### Existing Real-time Infrastructure

- **SSE Provider**: Custom Server-Sent Events implementation for unidirectional real-time updates
- **Collaborative Editing**: Database-persisted locks with automatic expiry and ownership tracking
- **Event Broadcasting**: Role-based event filtering for various business entities
- **Better Auth**: Session management with role-based access control

### Strengths of Current System

1. Simple unidirectional updates via SSE
2. Comprehensive lock management for collaborative editing
3. Role-based event filtering
4. Automatic reconnection and state restoration

### Areas for Enhancement

1. Bidirectional real-time communication
2. Type-safe API endpoints
3. Presence awareness for collaborative features
4. Optimistic updates with conflict resolution
5. Real-time cursor positions and selections

## Integration Strategy

### Phase 1: tRPC Setup and Migration (Week 1-2)

#### 1.1 Install Dependencies

```bash
pnpm add @trpc/server @trpc/client @trpc/react-query @trpc/next @tanstack/react-query@^5 superjson
pnpm add -D @types/superjson
```

#### 1.2 Create tRPC Infrastructure

```
/server/
  ├── api/
  │   ├── root.ts          # Root router combining all routers
  │   ├── trpc.ts          # tRPC instance with context
  │   └── routers/
  │       ├── user.ts       # User management procedures
  │       ├── dashboard.ts  # Dashboard data procedures
  │       ├── inventory.ts  # Inventory procedures
  │       ├── jobCard.ts    # Job card procedures
  │       └── order.ts      # Order procedures
  ├── context.ts           # Context creation with Better Auth
  └── db.ts                # Database client export
```

#### 1.3 tRPC Context with Better Auth Integration

```typescript
// server/context.ts
import { auth } from "@/lib/auth";
import { db } from "@/db";
import type { FetchCreateContextFnOptions } from "@trpc/server/adapters/fetch";

export async function createContext(opts: FetchCreateContextFnOptions) {
  const session = await auth.api.getSession({
    headers: opts.req.headers,
  });

  return {
    db,
    session,
    user: session?.user,
    headers: opts.req.headers,
  };
}

export type Context = Awaited<ReturnType<typeof createContext>>;
```

#### 1.4 Protected Procedures

```typescript
// server/api/trpc.ts
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { Context } from "../context";

const t = initTRPC.context<Context>().create({
  transformer: superjson,
});

export const router = t.router;
export const publicProcedure = t.procedure;

export const protectedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
      user: ctx.user,
    },
  });
});

export const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN" });
  }
  return next({ ctx });
});
```

### Phase 2: Supabase Realtime Integration (Week 2-3)

#### 2.1 Install Supabase Client

```bash
pnpm add @supabase/supabase-js @supabase/realtime-js
```

#### 2.2 Configure Supabase Client with Better Auth Sessions

```typescript
// lib/supabase-client.ts
import { createClient } from "@supabase/supabase-js";
import { useSession } from "@/lib/auth-client";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Let Better Auth handle sessions
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Hook to get authenticated Supabase client
export function useSupabaseClient() {
  const { data: session } = useSession();

  // Set custom JWT for Supabase Realtime auth
  if (session?.user) {
    supabase.realtime.setAuth(session.token);
  }

  return supabase;
}
```

#### 2.3 Database Schema for Realtime Features

```sql
-- Enable Realtime for specific tables
ALTER PUBLICATION supabase_realtime ADD TABLE dashboard_widgets;
ALTER PUBLICATION supabase_realtime ADD TABLE collaborative_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;

-- Dashboard widgets table
CREATE TABLE dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES user(id) ON DELETE CASCADE,
  widget_type TEXT NOT NULL,
  position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "w": 4, "h": 3}',
  config JSONB DEFAULT '{}',
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Collaborative documents
CREATE TABLE collaborative_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}',
  created_by TEXT NOT NULL REFERENCES user(id),
  last_edited_by TEXT REFERENCES user(id),
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User presence for real-time awareness
CREATE TABLE user_presence (
  user_id TEXT PRIMARY KEY REFERENCES user(id) ON DELETE CASCADE,
  status TEXT DEFAULT 'online',
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  current_page TEXT,
  cursor_position JSONB,
  selected_element TEXT,
  metadata JSONB DEFAULT '{}'
);

-- Row Level Security
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborative_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own widgets" ON dashboard_widgets
  FOR ALL USING (auth.uid()::text = user_id);

CREATE POLICY "Users can view all documents" ON collaborative_documents
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can edit documents" ON collaborative_documents
  FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can view all presence" ON user_presence
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own presence" ON user_presence
  FOR ALL USING (auth.uid()::text = user_id);
```

### Phase 3: Real-time Collaborative Dashboard Implementation (Week 3-4)

#### 3.1 Dashboard Layout System with tRPC

```typescript
// server/api/routers/dashboard.ts
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";

const widgetPositionSchema = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
});

export const dashboardRouter = router({
  getWidgets: protectedProcedure.query(async ({ ctx }) => {
    return ctx.db.query.dashboardWidgets.findMany({
      where: eq(dashboardWidgets.userId, ctx.user.id),
    });
  }),

  updateWidgetPosition: protectedProcedure
    .input(
      z.object({
        widgetId: z.string(),
        position: widgetPositionSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Update in database
      const updated = await ctx.db
        .update(dashboardWidgets)
        .set({
          position: input.position,
          updatedAt: new Date(),
        })
        .where(eq(dashboardWidgets.id, input.widgetId))
        .returning();

      // Broadcast via existing SSE system
      await broadcastRealtimeEvent("dashboard-widget-updated", {
        widgetId: input.widgetId,
        position: input.position,
        userId: ctx.user.id,
      });

      return updated[0];
    }),

  addWidget: protectedProcedure
    .input(
      z.object({
        type: z.enum(["stats", "chart", "table", "calendar", "tasks"]),
        config: z.record(z.any()).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const widget = await ctx.db
        .insert(dashboardWidgets)
        .values({
          userId: ctx.user.id,
          widgetType: input.type,
          config: input.config || {},
        })
        .returning();

      return widget[0];
    }),
});
```

#### 3.2 Real-time Collaborative Features Component

```typescript
// components/dashboard/collaborative-dashboard.tsx
"use client";

import { useEffect, useState } from 'react';
import { useSupabaseClient } from '@/lib/supabase-client';
import { trpc } from '@/lib/trpc';
import { GridLayout } from 'react-grid-layout';
import { useSSE } from '@/components/providers/sse-provider';

export function CollaborativeDashboard() {
  const supabase = useSupabaseClient();
  const { data: widgets, refetch } = trpc.dashboard.getWidgets.useQuery();
  const updatePosition = trpc.dashboard.updateWidgetPosition.useMutation();
  const { userRole } = useSSE();

  const [presence, setPresence] = useState<Map<string, any>>(new Map());
  const [layouts, setLayouts] = useState([]);

  useEffect(() => {
    // Subscribe to widget changes
    const widgetChannel = supabase
      .channel('dashboard-widgets')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'dashboard_widgets',
        },
        (payload) => {
          // Refetch widgets when changes occur
          refetch();
        }
      )
      .subscribe();

    // Subscribe to presence
    const presenceChannel = supabase.channel('dashboard-presence')
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        setPresence(new Map(Object.entries(state)));
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        setPresence(prev => new Map(prev).set(key, newPresences));
      })
      .on('presence', { event: 'leave' }, ({ key }) => {
        setPresence(prev => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({
            user_id: session?.user?.id,
            user_email: session?.user?.email,
            online_at: new Date().toISOString(),
          });
        }
      });

    return () => {
      supabase.removeChannel(widgetChannel);
      supabase.removeChannel(presenceChannel);
    };
  }, [supabase, refetch]);

  const handleLayoutChange = async (newLayout: any[]) => {
    // Optimistic update
    setLayouts(newLayout);

    // Persist changes via tRPC
    for (const item of newLayout) {
      await updatePosition.mutateAsync({
        widgetId: item.i,
        position: {
          x: item.x,
          y: item.y,
          w: item.w,
          h: item.h,
        },
      });
    }
  };

  return (
    <div className="relative">
      {/* Presence indicators */}
      <div className="absolute top-0 right-0 flex gap-2 p-4">
        {Array.from(presence.values()).map((user) => (
          <div
            key={user.user_id}
            className="flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1"
          >
            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-sm">{user.user_email}</span>
          </div>
        ))}
      </div>

      {/* Grid Layout */}
      <GridLayout
        className="layout"
        layout={layouts}
        onLayoutChange={handleLayoutChange}
        cols={12}
        rowHeight={100}
        width={1200}
        draggableHandle=".widget-header"
        isDraggable={userRole === 'admin'}
        isResizable={userRole === 'admin'}
      >
        {widgets?.map((widget) => (
          <div key={widget.id} className="border rounded-lg shadow-sm bg-white">
            <WidgetComponent widget={widget} />
          </div>
        ))}
      </GridLayout>
    </div>
  );
}
```

#### 3.3 Hybrid Real-time Architecture

```typescript
// hooks/use-hybrid-realtime.ts
import { useEffect } from "react";
import { useSSE } from "@/components/providers/sse-provider";
import { useSupabaseClient } from "@/lib/supabase-client";

export function useHybridRealtime({
  sseEvents,
  supabaseChannels,
  onUpdate,
}: {
  sseEvents?: string[];
  supabaseChannels?: Array<{
    channel: string;
    event: string;
    filter?: any;
  }>;
  onUpdate: (data: any) => void;
}) {
  const { isConnected } = useSSE();
  const supabase = useSupabaseClient();

  useEffect(() => {
    const subscriptions: any[] = [];

    // SSE subscriptions
    if (sseEvents && isConnected) {
      sseEvents.forEach((eventName) => {
        const handler = (event: CustomEvent) => onUpdate(event.detail);
        window.addEventListener(eventName, handler as EventListener);
        subscriptions.push(() =>
          window.removeEventListener(eventName, handler as EventListener),
        );
      });
    }

    // Supabase subscriptions
    if (supabaseChannels) {
      supabaseChannels.forEach(({ channel, event, filter }) => {
        const sub = supabase
          .channel(channel)
          .on("postgres_changes", { event, ...filter }, onUpdate)
          .subscribe();

        subscriptions.push(() => supabase.removeChannel(sub));
      });
    }

    return () => {
      subscriptions.forEach((unsub) => unsub());
    };
  }, [sseEvents, supabaseChannels, onUpdate, isConnected, supabase]);
}
```

### Phase 4: Advanced Collaborative Features (Week 4-5)

#### 4.1 Real-time Cursor Tracking

```typescript
// components/collaborative/cursor-tracker.tsx
export function CursorTracker({ documentId }: { documentId: string }) {
  const [cursors, setCursors] = useState<Map<string, CursorPosition>>(new Map());
  const supabase = useSupabaseClient();
  const { data: session } = useSession();

  useEffect(() => {
    const channel = supabase.channel(`doc-${documentId}`)
      .on('broadcast', { event: 'cursor' }, ({ payload }) => {
        setCursors(prev => new Map(prev).set(payload.userId, payload));
      })
      .subscribe();

    // Track mouse movement
    const handleMouseMove = throttle((e: MouseEvent) => {
      channel.send({
        type: 'broadcast',
        event: 'cursor',
        payload: {
          userId: session?.user?.id,
          x: e.clientX,
          y: e.clientY,
          userName: session?.user?.name,
        },
      });
    }, 50);

    document.addEventListener('mousemove', handleMouseMove);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      supabase.removeChannel(channel);
    };
  }, [documentId, session, supabase]);

  return (
    <>
      {Array.from(cursors.entries()).map(([userId, cursor]) => (
        userId !== session?.user?.id && (
          <div
            key={userId}
            className="absolute pointer-events-none z-50"
            style={{
              left: cursor.x,
              top: cursor.y,
              transform: 'translate(-50%, -50%)',
            }}
          >
            <div className="relative">
              <CursorIcon className="w-4 h-4 text-blue-500" />
              <span className="absolute top-4 left-4 text-xs bg-blue-500 text-white px-1 rounded">
                {cursor.userName}
              </span>
            </div>
          </div>
        )
      ))}
    </>
  );
}
```

#### 4.2 Conflict Resolution for Collaborative Editing

```typescript
// lib/conflict-resolution.ts
import { diff_match_patch } from "diff-match-patch";

export class ConflictResolver {
  private dmp = new diff_match_patch();

  resolveTextConflict(
    base: string,
    local: string,
    remote: string,
  ): { resolved: string; hasConflicts: boolean } {
    // If local and remote are the same, no conflict
    if (local === remote) {
      return { resolved: local, hasConflicts: false };
    }

    // Calculate diffs
    const localDiffs = this.dmp.diff_main(base, local);
    const remoteDiffs = this.dmp.diff_main(base, remote);

    // Apply both sets of changes
    const patches1 = this.dmp.patch_make(base, localDiffs);
    const patches2 = this.dmp.patch_make(base, remoteDiffs);

    // Try to apply both patches
    const [resolved1, results1] = this.dmp.patch_apply(patches1, base);
    const [resolved2, results2] = this.dmp.patch_apply(patches2, resolved1);

    const hasConflicts = results1.includes(false) || results2.includes(false);

    return {
      resolved: resolved2,
      hasConflicts,
    };
  }

  // For structured data (JSON)
  resolveJsonConflict(
    base: any,
    local: any,
    remote: any,
  ): { resolved: any; conflicts: string[] } {
    const conflicts: string[] = [];
    const resolved = this.deepMerge(base, local, remote, "", conflicts);

    return { resolved, conflicts };
  }

  private deepMerge(
    base: any,
    local: any,
    remote: any,
    path: string,
    conflicts: string[],
  ): any {
    // Implementation of three-way merge for JSON objects
    // ... (detailed implementation)
  }
}
```

### Phase 5: Performance Optimization & Migration (Week 5-6)

#### 5.1 Gradual Migration Strategy

1. **Parallel Running**: Keep SSE system running alongside new implementations
2. **Feature Flags**: Use environment variables to toggle between systems
3. **A/B Testing**: Roll out to subset of users first
4. **Monitoring**: Track performance metrics and user feedback

#### 5.2 Performance Optimizations

```typescript
// lib/realtime-optimizations.ts

// 1. Debounced updates for high-frequency changes
export const useDebouncedRealtimeUpdate = (
  updateFn: (data: any) => void,
  delay: number = 300,
) => {
  const debouncedUpdate = useMemo(
    () => debounce(updateFn, delay),
    [updateFn, delay],
  );

  return debouncedUpdate;
};

// 2. Batched updates for multiple changes
export class UpdateBatcher {
  private queue: Map<string, any> = new Map();
  private timer: NodeJS.Timeout | null = null;

  constructor(
    private batchSize: number = 10,
    private batchDelay: number = 100,
    private onFlush: (updates: any[]) => void,
  ) {}

  add(id: string, update: any) {
    this.queue.set(id, update);

    if (this.queue.size >= this.batchSize) {
      this.flush();
    } else if (!this.timer) {
      this.timer = setTimeout(() => this.flush(), this.batchDelay);
    }
  }

  private flush() {
    if (this.queue.size === 0) return;

    const updates = Array.from(this.queue.values());
    this.queue.clear();

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    this.onFlush(updates);
  }
}

// 3. Connection pooling for Supabase channels
export class ChannelPool {
  private channels: Map<string, any> = new Map();
  private refCounts: Map<string, number> = new Map();

  getChannel(name: string, supabase: any): any {
    if (this.channels.has(name)) {
      this.refCounts.set(name, (this.refCounts.get(name) || 0) + 1);
      return this.channels.get(name);
    }

    const channel = supabase.channel(name);
    this.channels.set(name, channel);
    this.refCounts.set(name, 1);

    return channel;
  }

  releaseChannel(name: string, supabase: any) {
    const count = this.refCounts.get(name) || 0;

    if (count <= 1) {
      const channel = this.channels.get(name);
      if (channel) {
        supabase.removeChannel(channel);
        this.channels.delete(name);
        this.refCounts.delete(name);
      }
    } else {
      this.refCounts.set(name, count - 1);
    }
  }
}
```

## Implementation Timeline

### Week 1-2: Foundation

- [ ] Set up tRPC with Better Auth integration
- [ ] Create base routers for existing features
- [ ] Migrate select API endpoints to tRPC
- [ ] Set up development environment

### Week 2-3: Supabase Integration

- [ ] Configure Supabase client with Better Auth
- [ ] Create database tables for real-time features
- [ ] Implement basic Supabase Realtime subscriptions
- [ ] Test hybrid approach with SSE

### Week 3-4: Dashboard Implementation

- [ ] Build collaborative dashboard with widgets
- [ ] Implement drag-and-drop with real-time sync
- [ ] Add presence awareness
- [ ] Create widget library

### Week 4-5: Advanced Features

- [ ] Implement cursor tracking
- [ ] Add conflict resolution
- [ ] Build collaborative document editor
- [ ] Optimize performance

### Week 5-6: Testing & Migration

- [ ] Comprehensive testing
- [ ] Performance benchmarking
- [ ] Gradual rollout
- [ ] Documentation

## Key Benefits

1. **Type Safety**: End-to-end type safety with tRPC
2. **Real-time Collaboration**: Enhanced with Supabase Realtime
3. **Optimistic Updates**: Better UX with immediate feedback
4. **Scalability**: Supabase handles WebSocket connections
5. **Developer Experience**: Improved with TypeScript inference

## Risks & Mitigation

1. **Complexity**: Mitigate with gradual migration
2. **Performance**: Monitor and optimize continuously
3. **Learning Curve**: Provide team training and documentation
4. **Compatibility**: Ensure Better Auth integration works smoothly

## Success Metrics

1. **Performance**: <100ms latency for real-time updates
2. **Reliability**: 99.9% uptime for real-time features
3. **User Satisfaction**: Improved collaboration feedback
4. **Developer Velocity**: 30% faster feature development

## Conclusion

This integration plan provides a roadmap for enhancing the Portal app with modern real-time capabilities while maintaining the existing SSE infrastructure. The hybrid approach ensures a smooth transition and allows for gradual adoption of new features.
