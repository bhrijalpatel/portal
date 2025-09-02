# Supabase Realtime Integration Guide

## Overview

This guide shows how to integrate Supabase Realtime with your existing Portal app, working alongside your SSE infrastructure and Better Auth system.

## 1. Set Up Supabase Project

### 1.1 Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Create a new project
3. Save your project URL and anon key

### 1.2 Update Environment Variables

Add to your `.env.local`:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Your existing database URL
DATABASE_URL=your-existing-postgres-url
```

## 2. Install Dependencies

```bash
pnpm add @supabase/supabase-js @supabase/realtime-js
pnpm add -D @types/diff-match-patch diff-match-patch
```

## 3. Configure Supabase Client

Create `lib/supabase/client.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types"; // We'll generate this

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // Better Auth handles sessions
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});
```

Create `lib/supabase/server.ts`:

```typescript
import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

export const supabaseAdmin = createClient<Database>(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      persistSession: false,
    },
  },
);
```

## 4. Create Custom Hook for Authenticated Supabase

Create `hooks/use-supabase.ts`:

```typescript
"use client";

import { useEffect, useMemo } from "react";
import { createClient } from "@supabase/supabase-js";
import { useSession } from "@/lib/auth-client";
import type { Database } from "@/lib/supabase/database.types";

export function useSupabase() {
  const { data: session } = useSession();

  const supabase = useMemo(() => {
    return createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        auth: {
          persistSession: false,
        },
        global: {
          headers: {
            // Pass Better Auth session token if available
            Authorization: session?.token ? `Bearer ${session.token}` : "",
          },
        },
      },
    );
  }, [session?.token]);

  // Update auth token when session changes
  useEffect(() => {
    if (session?.token) {
      supabase.realtime.setAuth(session.token);
    }
  }, [session?.token, supabase]);

  return supabase;
}
```

## 5. Database Schema for Realtime Features

### 5.1 Create Migration

Create `supabase/migrations/001_realtime_tables.sql`:

```sql
-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Dashboard widgets table
CREATE TABLE IF NOT EXISTS dashboard_widgets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id TEXT NOT NULL,
  widget_type TEXT NOT NULL CHECK (widget_type IN ('stats', 'chart', 'table', 'calendar', 'tasks')),
  position JSONB NOT NULL DEFAULT '{"x": 0, "y": 0, "w": 4, "h": 3}'::jsonb,
  config JSONB DEFAULT '{}'::jsonb,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

-- Collaborative documents
CREATE TABLE IF NOT EXISTS collaborative_documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_by TEXT NOT NULL,
  last_edited_by TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_created_by FOREIGN KEY (created_by) REFERENCES "user"(id),
  CONSTRAINT fk_last_edited_by FOREIGN KEY (last_edited_by) REFERENCES "user"(id)
);

-- User presence for real-time awareness
CREATE TABLE IF NOT EXISTS user_presence (
  user_id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  status TEXT DEFAULT 'online' CHECK (status IN ('online', 'away', 'busy', 'offline')),
  last_seen TIMESTAMPTZ DEFAULT NOW(),
  current_page TEXT,
  cursor_position JSONB,
  selected_element TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  CONSTRAINT fk_user_presence FOREIGN KEY (user_id) REFERENCES "user"(id) ON DELETE CASCADE
);

-- Document operations for collaborative editing
CREATE TABLE IF NOT EXISTS document_operations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  document_id UUID NOT NULL,
  user_id TEXT NOT NULL,
  operation_type TEXT NOT NULL CHECK (operation_type IN ('insert', 'delete', 'format', 'move')),
  position INTEGER NOT NULL,
  content TEXT,
  attributes JSONB,
  version INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT fk_document FOREIGN KEY (document_id) REFERENCES collaborative_documents(id) ON DELETE CASCADE,
  CONSTRAINT fk_user_op FOREIGN KEY (user_id) REFERENCES "user"(id)
);

-- Create indexes
CREATE INDEX idx_dashboard_widgets_user_id ON dashboard_widgets(user_id);
CREATE INDEX idx_collaborative_documents_created_by ON collaborative_documents(created_by);
CREATE INDEX idx_document_operations_document_id ON document_operations(document_id);
CREATE INDEX idx_user_presence_status ON user_presence(status);

-- Enable Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE dashboard_widgets;
ALTER PUBLICATION supabase_realtime ADD TABLE collaborative_documents;
ALTER PUBLICATION supabase_realtime ADD TABLE user_presence;
ALTER PUBLICATION supabase_realtime ADD TABLE document_operations;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers
CREATE TRIGGER update_dashboard_widgets_updated_at BEFORE UPDATE ON dashboard_widgets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_collaborative_documents_updated_at BEFORE UPDATE ON collaborative_documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 5.2 Row Level Security (RLS)

Create `supabase/migrations/002_realtime_rls.sql`:

```sql
-- Enable RLS
ALTER TABLE dashboard_widgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborative_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_presence ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_operations ENABLE ROW LEVEL SECURITY;

-- Dashboard widgets policies
CREATE POLICY "Users can view their own widgets" ON dashboard_widgets
  FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can create their own widgets" ON dashboard_widgets
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own widgets" ON dashboard_widgets
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own widgets" ON dashboard_widgets
  FOR DELETE USING (auth.uid()::text = user_id);

-- Collaborative documents policies
CREATE POLICY "Anyone can view documents" ON collaborative_documents
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create documents" ON collaborative_documents
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update documents" ON collaborative_documents
  FOR UPDATE USING (auth.uid() IS NOT NULL);

CREATE POLICY "Document creators can delete their documents" ON collaborative_documents
  FOR DELETE USING (auth.uid()::text = created_by);

-- User presence policies
CREATE POLICY "Anyone can view presence" ON user_presence
  FOR SELECT USING (true);

CREATE POLICY "Users can update their own presence" ON user_presence
  FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own presence" ON user_presence
  FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own presence" ON user_presence
  FOR DELETE USING (auth.uid()::text = user_id);

-- Document operations policies
CREATE POLICY "Anyone can view operations" ON document_operations
  FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create operations" ON document_operations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
```

## 6. Create Realtime Hooks

### 6.1 Presence Hook

Create `hooks/use-presence.ts`:

```typescript
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSupabase } from "./use-supabase";
import { useSession } from "@/lib/auth-client";
import { RealtimeChannel } from "@supabase/supabase-js";

interface PresenceState {
  [key: string]: {
    user_id: string;
    user_email: string;
    online_at: string;
    current_page?: string;
    cursor_position?: { x: number; y: number };
  }[];
}

export function usePresence(channelName: string) {
  const supabase = useSupabase();
  const { data: session } = useSession();
  const [presenceState, setPresenceState] = useState<PresenceState>({});
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    if (!session?.user) return;

    const presenceChannel = supabase.channel(channelName, {
      config: {
        presence: {
          key: session.user.id,
        },
      },
    });

    presenceChannel
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        setPresenceState(state);
      })
      .on("presence", { event: "join" }, ({ key, newPresences }) => {
        console.log("User joined:", key, newPresences);
      })
      .on("presence", { event: "leave" }, ({ key, leftPresences }) => {
        console.log("User left:", key, leftPresences);
      })
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await presenceChannel.track({
            user_id: session.user.id,
            user_email: session.user.email || "Unknown",
            online_at: new Date().toISOString(),
            current_page: window.location.pathname,
          });
        }
      });

    setChannel(presenceChannel);

    return () => {
      presenceChannel.unsubscribe();
    };
  }, [channelName, session, supabase]);

  const updatePresence = useCallback(
    async (data: Record<string, any>) => {
      if (!channel || !session?.user) return;

      await channel.track({
        user_id: session.user.id,
        user_email: session.user.email || "Unknown",
        online_at: new Date().toISOString(),
        ...data,
      });
    },
    [channel, session],
  );

  const getAllUsers = useCallback(() => {
    return Object.values(presenceState).flat();
  }, [presenceState]);

  return {
    presenceState,
    updatePresence,
    getAllUsers,
    channel,
  };
}
```

### 6.2 Broadcast Hook

Create `hooks/use-broadcast.ts`:

```typescript
"use client";

import { useEffect, useState, useCallback } from "react";
import { useSupabase } from "./use-supabase";
import { RealtimeChannel } from "@supabase/supabase-js";

interface BroadcastMessage {
  type: string;
  payload: any;
  sender_id?: string;
}

export function useBroadcast(
  channelName: string,
  onMessage?: (message: BroadcastMessage) => void,
) {
  const supabase = useSupabase();
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);

  useEffect(() => {
    const broadcastChannel = supabase.channel(channelName);

    if (onMessage) {
      broadcastChannel.on("broadcast", { event: "message" }, ({ payload }) => {
        onMessage(payload as BroadcastMessage);
      });
    }

    broadcastChannel.subscribe();
    setChannel(broadcastChannel);

    return () => {
      broadcastChannel.unsubscribe();
    };
  }, [channelName, onMessage, supabase]);

  const broadcast = useCallback(
    async (message: BroadcastMessage) => {
      if (!channel) return;

      await channel.send({
        type: "broadcast",
        event: "message",
        payload: message,
      });
    },
    [channel],
  );

  return { broadcast, channel };
}
```

### 6.3 Database Changes Hook

Create `hooks/use-realtime-table.ts`:

```typescript
"use client";

import { useEffect } from "react";
import { useSupabase } from "./use-supabase";
import { RealtimePostgresChangesPayload } from "@supabase/supabase-js";

interface UseRealtimeTableOptions {
  table: string;
  schema?: string;
  filter?: string;
  onInsert?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onUpdate?: (payload: RealtimePostgresChangesPayload<any>) => void;
  onDelete?: (payload: RealtimePostgresChangesPayload<any>) => void;
}

export function useRealtimeTable({
  table,
  schema = "public",
  filter,
  onInsert,
  onUpdate,
  onDelete,
}: UseRealtimeTableOptions) {
  const supabase = useSupabase();

  useEffect(() => {
    const channel = supabase
      .channel(`${table}-changes`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema,
          table,
          filter,
        },
        (payload) => {
          switch (payload.eventType) {
            case "INSERT":
              onInsert?.(payload);
              break;
            case "UPDATE":
              onUpdate?.(payload);
              break;
            case "DELETE":
              onDelete?.(payload);
              break;
          }
        },
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [table, schema, filter, onInsert, onUpdate, onDelete, supabase]);
}
```

## 7. Create Collaborative Dashboard Components

### 7.1 Dashboard Widget Component

Create `components/dashboard/dashboard-widget.tsx`:

```typescript
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { GripVertical, X, Settings } from "lucide-react";
import { cn } from "@/utils/cn";

interface DashboardWidgetProps {
  id: string;
  title: string;
  type: "stats" | "chart" | "table" | "calendar" | "tasks";
  children: React.ReactNode;
  onRemove?: () => void;
  onSettings?: () => void;
  className?: string;
  isDragging?: boolean;
  canEdit?: boolean;
}

export function DashboardWidget({
  id,
  title,
  type,
  children,
  onRemove,
  onSettings,
  className,
  isDragging,
  canEdit = false,
}: DashboardWidgetProps) {
  return (
    <Card
      className={cn(
        "group relative overflow-hidden transition-all",
        isDragging && "opacity-50 scale-95",
        className
      )}
    >
      <CardHeader className="widget-header flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="flex items-center gap-2">
          {canEdit && (
            <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
          )}
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
        </div>
        {canEdit && (
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onSettings && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onSettings}
              >
                <Settings className="h-4 w-4" />
              </Button>
            )}
            {onRemove && (
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={onRemove}
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        )}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
```

### 7.2 Collaborative Dashboard

Create `components/dashboard/collaborative-dashboard.tsx`:

```typescript
"use client";

import { useEffect, useState, useCallback } from "react";
import { Responsive, WidthProvider, Layout } from "react-grid-layout";
import { usePresence } from "@/hooks/use-presence";
import { useRealtimeTable } from "@/hooks/use-realtime-table";
import { DashboardWidget } from "./dashboard-widget";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc/client";
import "react-grid-layout/css/styles.css";
import "react-resizable/css/styles.css";

const ResponsiveGridLayout = WidthProvider(Responsive);

interface Widget {
  id: string;
  user_id: string;
  widget_type: "stats" | "chart" | "table" | "calendar" | "tasks";
  position: { x: number; y: number; w: number; h: number };
  config: Record<string, any>;
  is_visible: boolean;
}

export function CollaborativeDashboard() {
  const [widgets, setWidgets] = useState<Widget[]>([]);
  const [layouts, setLayouts] = useState<Record<string, Layout[]>>({});
  const { presenceState, getAllUsers } = usePresence("dashboard-collaborative");

  const { data: userRole } = trpc.user.me.useQuery();
  const { data: dashboardWidgets, refetch } = trpc.dashboard.getWidgets.useQuery();
  const updateWidget = trpc.dashboard.updateWidgetPosition.useMutation();
  const addWidget = trpc.dashboard.addWidget.useMutation();
  const removeWidget = trpc.dashboard.removeWidget.useMutation();

  // Subscribe to widget changes
  useRealtimeTable({
    table: "dashboard_widgets",
    onInsert: (payload) => {
      toast.info("New widget added");
      refetch();
    },
    onUpdate: (payload) => {
      // Update local state optimistically
      setWidgets((prev) =>
        prev.map((w) =>
          w.id === payload.new.id
            ? { ...w, ...payload.new }
            : w
        )
      );
    },
    onDelete: (payload) => {
      toast.info("Widget removed");
      refetch();
    },
  });

  // Convert widgets to grid layouts
  useEffect(() => {
    if (dashboardWidgets) {
      setWidgets(dashboardWidgets);

      const newLayouts = {
        lg: dashboardWidgets.map((w) => ({
          i: w.id,
          x: w.position.x,
          y: w.position.y,
          w: w.position.w,
          h: w.position.h,
        })),
      };
      setLayouts(newLayouts);
    }
  }, [dashboardWidgets]);

  const handleLayoutChange = useCallback(
    async (currentLayout: Layout[], allLayouts: Record<string, Layout[]>) => {
      // Only update if user has edit permissions
      if (userRole?.role !== "admin") return;

      // Update each changed widget
      for (const item of currentLayout) {
        const widget = widgets.find((w) => w.id === item.i);
        if (
          widget &&
          (widget.position.x !== item.x ||
            widget.position.y !== item.y ||
            widget.position.w !== item.w ||
            widget.position.h !== item.h)
        ) {
          await updateWidget.mutateAsync({
            widgetId: item.i,
            position: {
              x: item.x,
              y: item.y,
              w: item.w,
              h: item.h,
            },
          });
        }
      }
    },
    [widgets, updateWidget, userRole]
  );

  const handleAddWidget = async (type: Widget["widget_type"]) => {
    try {
      await addWidget.mutateAsync({
        type,
        config: {},
      });
      toast.success("Widget added successfully");
      refetch();
    } catch (error) {
      toast.error("Failed to add widget");
    }
  };

  const handleRemoveWidget = async (widgetId: string) => {
    try {
      await removeWidget.mutateAsync({ widgetId });
      toast.success("Widget removed");
      refetch();
    } catch (error) {
      toast.error("Failed to remove widget");
    }
  };

  const renderWidget = (widget: Widget) => {
    return (
      <DashboardWidget
        key={widget.id}
        id={widget.id}
        title={getWidgetTitle(widget.widget_type)}
        type={widget.widget_type}
        onRemove={
          userRole?.role === "admin"
            ? () => handleRemoveWidget(widget.id)
            : undefined
        }
        canEdit={userRole?.role === "admin"}
      >
        {renderWidgetContent(widget)}
      </DashboardWidget>
    );
  };

  return (
    <div className="relative">
      {/* Presence Indicators */}
      <div className="absolute -top-12 right-0 flex items-center gap-2">
        <span className="text-sm text-muted-foreground">
          {getAllUsers().length} user{getAllUsers().length !== 1 ? "s" : ""} online
        </span>
        <div className="flex -space-x-2">
          {getAllUsers().slice(0, 5).map((user) => (
            <div
              key={user.user_id}
              className="h-8 w-8 rounded-full bg-emerald-500 border-2 border-background flex items-center justify-center text-xs font-medium text-white"
              title={user.user_email}
            >
              {user.user_email.charAt(0).toUpperCase()}
            </div>
          ))}
          {getAllUsers().length > 5 && (
            <div className="h-8 w-8 rounded-full bg-muted border-2 border-background flex items-center justify-center text-xs font-medium">
              +{getAllUsers().length - 5}
            </div>
          )}
        </div>
      </div>

      {/* Add Widget Button */}
      {userRole?.role === "admin" && (
        <div className="mb-4 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddWidget("stats")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Stats
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddWidget("chart")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Chart
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleAddWidget("table")}
          >
            <Plus className="h-4 w-4 mr-2" />
            Add Table
          </Button>
        </div>
      )}

      {/* Grid Layout */}
      <ResponsiveGridLayout
        className="layout"
        layouts={layouts}
        onLayoutChange={handleLayoutChange}
        breakpoints={{ lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 }}
        cols={{ lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 }}
        rowHeight={100}
        isDraggable={userRole?.role === "admin"}
        isResizable={userRole?.role === "admin"}
        draggableHandle=".widget-header"
        margin={[16, 16]}
      >
        {widgets.filter((w) => w.is_visible).map(renderWidget)}
      </ResponsiveGridLayout>
    </div>
  );
}

function getWidgetTitle(type: Widget["widget_type"]): string {
  const titles = {
    stats: "Statistics",
    chart: "Chart",
    table: "Data Table",
    calendar: "Calendar",
    tasks: "Tasks",
  };
  return titles[type] || "Widget";
}

function renderWidgetContent(widget: Widget): React.ReactNode {
  switch (widget.widget_type) {
    case "stats":
      return (
        <div className="space-y-2">
          <p className="text-2xl font-bold">1,234</p>
          <p className="text-xs text-muted-foreground">Total Orders</p>
        </div>
      );
    case "chart":
      return (
        <div className="h-[200px] flex items-center justify-center text-muted-foreground">
          Chart placeholder
        </div>
      );
    case "table":
      return (
        <div className="text-sm">
          <div className="border-b pb-2 mb-2">Recent Activity</div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">No data</div>
          </div>
        </div>
      );
    default:
      return <div>Widget content</div>;
  }
}
```

## 8. Implement Cursor Tracking

Create `components/collaborative/cursor-provider.tsx`:

```typescript
"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { useBroadcast } from "@/hooks/use-broadcast";
import { useSession } from "@/lib/auth-client";
import { throttle } from "lodash";

interface Cursor {
  userId: string;
  userEmail: string;
  x: number;
  y: number;
  color: string;
}

interface CursorContextType {
  cursors: Map<string, Cursor>;
  updateCursor: (x: number, y: number) => void;
}

const CursorContext = createContext<CursorContextType | null>(null);

export function useCursors() {
  const context = useContext(CursorContext);
  if (!context) {
    throw new Error("useCursors must be used within CursorProvider");
  }
  return context;
}

const CURSOR_COLORS = [
  "#ef4444", // red
  "#f97316", // orange
  "#eab308", // yellow
  "#22c55e", // green
  "#06b6d4", // cyan
  "#3b82f6", // blue
  "#8b5cf6", // violet
  "#ec4899", // pink
];

export function CursorProvider({
  channelName,
  children,
}: {
  channelName: string;
  children: React.ReactNode;
}) {
  const { data: session } = useSession();
  const [cursors, setCursors] = useState<Map<string, Cursor>>(new Map());
  const [userColor] = useState(
    () => CURSOR_COLORS[Math.floor(Math.random() * CURSOR_COLORS.length)]
  );

  const { broadcast } = useBroadcast(channelName, (message) => {
    if (message.type === "cursor" && message.sender_id !== session?.user?.id) {
      setCursors((prev) => {
        const next = new Map(prev);
        next.set(message.sender_id!, {
          userId: message.sender_id!,
          userEmail: message.payload.userEmail,
          x: message.payload.x,
          y: message.payload.y,
          color: message.payload.color,
        });
        return next;
      });

      // Remove cursor after 5 seconds of inactivity
      setTimeout(() => {
        setCursors((prev) => {
          const next = new Map(prev);
          next.delete(message.sender_id!);
          return next;
        });
      }, 5000);
    }
  });

  const updateCursor = throttle((x: number, y: number) => {
    if (!session?.user) return;

    broadcast({
      type: "cursor",
      payload: {
        userEmail: session.user.email,
        x,
        y,
        color: userColor,
      },
      sender_id: session.user.id,
    });
  }, 50);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      updateCursor(e.clientX, e.clientY);
    };

    const handleMouseLeave = () => {
      // Broadcast cursor left
      if (session?.user) {
        broadcast({
          type: "cursor-leave",
          payload: {},
          sender_id: session.user.id,
        });
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, [updateCursor, broadcast, session]);

  return (
    <CursorContext.Provider value={{ cursors, updateCursor }}>
      {children}
    </CursorContext.Provider>
  );
}
```

## 9. Create Hybrid Real-time Provider

Create `providers/hybrid-realtime-provider.tsx`:

```typescript
"use client";

import { SSEProvider } from "@/components/providers/sse-provider";
import { CursorProvider } from "@/components/collaborative/cursor-provider";
import { usePathname } from "next/navigation";

export function HybridRealtimeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  // Determine which providers to activate based on the current page
  const isDashboard = pathname?.startsWith("/dashboard");
  const isCollaborative = pathname?.includes("/collaborative");

  return (
    <SSEProvider>
      {isCollaborative ? (
        <CursorProvider channelName={`cursors-${pathname}`}>
          {children}
        </CursorProvider>
      ) : (
        children
      )}
    </SSEProvider>
  );
}
```

## 10. Update tRPC Router for Dashboard

Update `server/api/routers/dashboard.ts`:

```typescript
import { z } from "zod";
import { router, protectedProcedure } from "../trpc";
import { eq } from "drizzle-orm";
import { dashboardWidgets } from "@/db/schema";
import { TRPCError } from "@trpc/server";

const widgetPositionSchema = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number(),
  h: z.number(),
});

export const dashboardRouter = router({
  getWidgets: protectedProcedure.query(async ({ ctx }) => {
    // For now, return widgets for the current user
    // Later, you might want to support shared dashboards
    const widgets = await ctx.db.query.dashboardWidgets.findMany({
      where: eq(dashboardWidgets.userId, ctx.user.id),
    });

    return widgets;
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
          position: { x: 0, y: 0, w: 4, h: 3 }, // Default position
        })
        .returning();

      return widget[0];
    }),

  updateWidgetPosition: protectedProcedure
    .input(
      z.object({
        widgetId: z.string().uuid(),
        position: widgetPositionSchema,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // Verify the widget belongs to the user
      const widget = await ctx.db.query.dashboardWidgets.findFirst({
        where: eq(dashboardWidgets.id, input.widgetId),
      });

      if (!widget || widget.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to update this widget",
        });
      }

      const updated = await ctx.db
        .update(dashboardWidgets)
        .set({
          position: input.position,
          updatedAt: new Date(),
        })
        .where(eq(dashboardWidgets.id, input.widgetId))
        .returning();

      return updated[0];
    }),

  removeWidget: protectedProcedure
    .input(z.object({ widgetId: z.string().uuid() }))
    .mutation(async ({ ctx, input }) => {
      // Verify the widget belongs to the user
      const widget = await ctx.db.query.dashboardWidgets.findFirst({
        where: eq(dashboardWidgets.id, input.widgetId),
      });

      if (!widget || widget.userId !== ctx.user.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You don't have permission to remove this widget",
        });
      }

      await ctx.db
        .delete(dashboardWidgets)
        .where(eq(dashboardWidgets.id, input.widgetId));

      return { success: true };
    }),
});
```

## 11. Migration Guide

### Step 1: Run Database Migrations

```bash
# Apply migrations to your existing database
psql $DATABASE_URL < supabase/migrations/001_realtime_tables.sql
psql $DATABASE_URL < supabase/migrations/002_realtime_rls.sql
```

### Step 2: Generate TypeScript Types

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# Generate types
supabase gen types typescript --project-id your-project-id > lib/supabase/database.types.ts
```

### Step 3: Update Environment Variables

Add to `.env.local`:

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Step 4: Test the Integration

1. Start your development server
2. Navigate to the dashboard
3. Open multiple browser windows
4. Test real-time updates and presence

## 12. Performance Considerations

1. **Connection Pooling**: Reuse Supabase channels when possible
2. **Throttling**: Throttle high-frequency updates (cursor movements)
3. **Selective Subscriptions**: Only subscribe to relevant tables/channels
4. **Cleanup**: Always unsubscribe when components unmount
5. **Batching**: Batch multiple updates when possible

## 13. Security Best Practices

1. **RLS Policies**: Always use Row Level Security
2. **Input Validation**: Validate all inputs on the server
3. **Rate Limiting**: Implement rate limiting for broadcasts
4. **Authentication**: Verify Better Auth sessions before allowing real-time access
5. **Data Filtering**: Filter sensitive data before broadcasting

## Next Steps

1. **Extend Widget Types**: Add more widget types (charts, calendars, etc.)
2. **Shared Dashboards**: Implement team/shared dashboards
3. **Widget Library**: Create a library of pre-built widgets
4. **Mobile Support**: Optimize for mobile devices
5. **Export/Import**: Allow dashboard configuration export/import

This completes the Supabase Realtime integration guide!
