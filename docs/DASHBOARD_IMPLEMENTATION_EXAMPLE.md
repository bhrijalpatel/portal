# Sample Dashboard Implementation

This file shows how to implement the enhanced collaborative dashboard with tRPC and Supabase Realtime in your Portal app.

## 1. Update Dashboard Page

Replace `app/(protected)/dashboard/page.tsx`:

```typescript
import { Suspense } from "react";
import { CollaborativeDashboard } from "@/components/dashboard/collaborative-dashboard";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

export default async function DashboardPage() {
  return (
    <section className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Collaborative Dashboard</h1>
        <p className="text-muted-foreground">
          Real-time collaborative workspace with customizable widgets
        </p>
      </div>

      <Suspense fallback={<DashboardSkeleton />}>
        <CollaborativeDashboard />
      </Suspense>
    </section>
  );
}
```

## 2. Create Dashboard Skeleton

Create `components/dashboard/dashboard-skeleton.tsx`:

```typescript
import { Skeleton } from "@/components/ui/skeleton";

export function DashboardSkeleton() {
  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-24" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64" />
        ))}
      </div>
    </div>
  );
}
```

## 3. Create Sample Widget Components

### Stats Widget

Create `components/dashboard/widgets/stats-widget.tsx`:

```typescript
"use client";

import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc/client";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatsConfig {
  metric: "users" | "orders" | "revenue" | "tasks";
}

export function StatsWidget({ config }: { config: StatsConfig }) {
  const { data, isLoading } = trpc.dashboard.getStats.useQuery();

  const renderMetric = () => {
    if (isLoading) {
      return (
        <div className="space-y-2">
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-4 w-16" />
        </div>
      );
    }

    const metric = config.metric || "users";
    const stats = {
      users: { value: data?.userCount || 0, change: 12 },
      orders: { value: 156, change: -5 },
      revenue: { value: "$12,345", change: 0 },
      tasks: { value: 24, change: 8 },
    };

    const current = stats[metric];
    const TrendIcon =
      current.change > 0 ? TrendingUp :
      current.change < 0 ? TrendingDown :
      Minus;

    return (
      <div className="space-y-2">
        <p className="text-2xl font-bold">{current.value}</p>
        <div className="flex items-center gap-2 text-xs">
          <TrendIcon className={`h-3 w-3 ${
            current.change > 0 ? "text-emerald-500" :
            current.change < 0 ? "text-rose-500" :
            "text-gray-500"
          }`} />
          <span className={
            current.change > 0 ? "text-emerald-500" :
            current.change < 0 ? "text-rose-500" :
            "text-gray-500"
          }>
            {Math.abs(current.change)}%
          </span>
          <span className="text-muted-foreground">vs last month</span>
        </div>
      </div>
    );
  };

  return renderMetric();
}
```

### Chart Widget

Create `components/dashboard/widgets/chart-widget.tsx`:

```typescript
"use client";

import { useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";

interface ChartConfig {
  type: "line" | "bar" | "pie";
  data?: any;
}

export function ChartWidget({ config }: { config: ChartConfig }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!canvasRef.current) return;

    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Simple placeholder chart
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;

    ctx.clearRect(0, 0, width, height);
    ctx.strokeStyle = "#e5e7eb";
    ctx.lineWidth = 2;

    // Draw axes
    ctx.beginPath();
    ctx.moveTo(40, height - 40);
    ctx.lineTo(width - 20, height - 40);
    ctx.moveTo(40, 20);
    ctx.lineTo(40, height - 40);
    ctx.stroke();

    // Draw sample data
    ctx.strokeStyle = "#10b981";
    ctx.beginPath();
    const points = [
      { x: 60, y: height - 80 },
      { x: 120, y: height - 120 },
      { x: 180, y: height - 100 },
      { x: 240, y: height - 140 },
      { x: 300, y: height - 110 },
    ];

    ctx.moveTo(points[0].x, points[0].y);
    points.forEach((point) => {
      ctx.lineTo(point.x, point.y);
    });
    ctx.stroke();

    // Draw points
    ctx.fillStyle = "#10b981";
    points.forEach((point) => {
      ctx.beginPath();
      ctx.arc(point.x, point.y, 4, 0, Math.PI * 2);
      ctx.fill();
    });
  }, [config]);

  return (
    <div className="h-[200px] p-4">
      <canvas
        ref={canvasRef}
        width={360}
        height={200}
        className="w-full h-full"
      />
    </div>
  );
}
```

### Activity Table Widget

Create `components/dashboard/widgets/table-widget.tsx`:

```typescript
"use client";

import { useUserRealtime } from "@/hooks/use-realtime";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  user: string;
}

export function TableWidget() {
  const [activities, setActivities] = useState<Activity[]>([
    {
      id: "1",
      type: "user-created",
      description: "New user registered",
      timestamp: new Date(),
      user: "System",
    },
  ]);

  // Subscribe to real-time updates
  useUserRealtime((event) => {
    const newActivity: Activity = {
      id: Date.now().toString(),
      type: event.detail.type,
      description: getActivityDescription(event.detail.type),
      timestamp: new Date(),
      user: event.detail.data.triggeredBy || "System",
    };

    setActivities((prev) => [newActivity, ...prev].slice(0, 10));
  });

  return (
    <ScrollArea className="h-[200px]">
      <div className="space-y-2">
        {activities.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No recent activity
          </p>
        ) : (
          activities.map((activity) => (
            <div
              key={activity.id}
              className="flex items-center justify-between text-sm"
            >
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {activity.type}
                </Badge>
                <span className="text-muted-foreground">
                  {activity.description}
                </span>
              </div>
              <span className="text-xs text-muted-foreground">
                {formatTime(activity.timestamp)}
              </span>
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
}

function getActivityDescription(type: string): string {
  const descriptions: Record<string, string> = {
    "user-created": "New user registered",
    "user-updated": "User profile updated",
    "user-deleted": "User account removed",
    "job-card-created": "New job card created",
    "order-created": "New order placed",
  };
  return descriptions[type] || "Activity occurred";
}

function formatTime(date: Date): string {
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const minutes = Math.floor(diff / 60000);

  if (minutes < 1) return "Just now";
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  return date.toLocaleDateString();
}
```

## 4. Update Widget Rendering

Update the `renderWidgetContent` function in `collaborative-dashboard.tsx`:

```typescript
import { StatsWidget } from "./widgets/stats-widget";
import { ChartWidget } from "./widgets/chart-widget";
import { TableWidget } from "./widgets/table-widget";

function renderWidgetContent(widget: Widget): React.ReactNode {
  switch (widget.widget_type) {
    case "stats":
      return <StatsWidget config={widget.config} />;
    case "chart":
      return <ChartWidget config={widget.config} />;
    case "table":
      return <TableWidget />;
    case "calendar":
      return (
        <div className="text-center text-muted-foreground py-8">
          Calendar widget coming soon
        </div>
      );
    case "tasks":
      return (
        <div className="text-center text-muted-foreground py-8">
          Tasks widget coming soon
        </div>
      );
    default:
      return <div>Unknown widget type</div>;
  }
}
```

## 5. Add Required Dependencies to package.json

```json
{
  "dependencies": {
    // ... existing dependencies
    "react-grid-layout": "^1.4.4",
    "lodash": "^4.17.21",
    "@types/lodash": "^4.14.202",
    "@types/react-grid-layout": "^1.3.5"
  }
}
```

## 6. Add Grid Layout Styles

Add to `app/globals.css`:

```css
/* React Grid Layout styles */
.react-grid-layout {
  position: relative;
  transition: height 200ms ease;
}

.react-grid-item {
  transition: all 200ms ease;
  transition-property: left, top, width, height;
}

.react-grid-item.cssTransforms {
  transition-property: transform, width, height;
}

.react-grid-item.resizing {
  transition: none;
  z-index: 10;
  will-change: width, height;
}

.react-grid-item.react-draggable-dragging {
  transition: none;
  z-index: 10;
  will-change: transform;
}

.react-grid-item.react-grid-placeholder {
  background: hsl(var(--primary) / 0.1);
  border: 2px dashed hsl(var(--primary) / 0.3);
  border-radius: var(--radius);
  transition-duration: 100ms;
  z-index: 0;
  user-select: none;
}

.react-grid-item > .react-resizable-handle {
  position: absolute;
  width: 20px;
  height: 20px;
}

.react-grid-item > .react-resizable-handle::after {
  content: "";
  position: absolute;
  right: 3px;
  bottom: 3px;
  width: 5px;
  height: 5px;
  border-right: 2px solid hsl(var(--muted-foreground) / 0.5);
  border-bottom: 2px solid hsl(var(--muted-foreground) / 0.5);
}

.react-resizable-hide > .react-resizable-handle {
  display: none;
}

/* Custom widget styles */
.widget-header {
  cursor: move;
}

.widget-header:hover {
  background-color: hsl(var(--muted) / 0.5);
}
```

## 7. Testing the Implementation

1. **Start Development Server**:

   ```bash
   pnpm dev
   ```

2. **Create Test Users**:
   - Sign up with multiple accounts
   - Make at least one user an admin

3. **Test Collaborative Features**:
   - Open dashboard in multiple browser windows
   - Sign in with different users
   - Admin can add/remove/rearrange widgets
   - All users see real-time updates
   - Check presence indicators

4. **Test Real-time Updates**:
   - Make changes in admin panel
   - Watch activity updates in dashboard
   - Test SSE reconnection by refreshing

## 8. Deployment Considerations

1. **Environment Variables**:

   ```bash
   # Production .env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   DATABASE_URL=your-postgres-connection-string
   ```

2. **Database Migrations**:
   - Run migrations on production database
   - Verify RLS policies are enabled
   - Test with production data

3. **Performance Optimization**:
   - Enable Supabase connection pooling
   - Configure CDN for static assets
   - Monitor WebSocket connections

4. **Security Checklist**:
   - ✅ RLS policies enabled
   - ✅ Input validation on server
   - ✅ Rate limiting configured
   - ✅ Better Auth session validation
   - ✅ Secure WebSocket connections

This completes the sample implementation!
