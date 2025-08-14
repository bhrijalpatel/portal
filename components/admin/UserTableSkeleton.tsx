export function UserTableSkeleton() {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-muted px-6 py-3 border-b">
        <div className="flex items-center gap-2">
          <div className="h-6 bg-muted-foreground/20 rounded w-32 animate-pulse" />
          <div className="h-4 bg-muted-foreground/20 rounded w-8 animate-pulse" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left p-4">
                <div className="h-4 bg-muted-foreground/20 rounded w-12 animate-pulse" />
              </th>
              <th className="text-left p-4">
                <div className="h-4 bg-muted-foreground/20 rounded w-16 animate-pulse" />
              </th>
              <th className="text-left p-4">
                <div className="h-4 bg-muted-foreground/20 rounded w-24 animate-pulse" />
              </th>
              <th className="text-left p-4">
                <div className="h-4 bg-muted-foreground/20 rounded w-12 animate-pulse" />
              </th>
              <th className="text-left p-4">
                <div className="h-4 bg-muted-foreground/20 rounded w-16 animate-pulse" />
              </th>
              <th className="text-left p-4">
                <div className="h-4 bg-muted-foreground/20 rounded w-8 animate-pulse" />
              </th>
            </tr>
          </thead>
          <tbody>
            {[...Array(8)].map((_, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? "bg-background" : "bg-muted/20"}
              >
                <td className="p-4">
                  <div className="h-4 bg-muted-foreground/20 rounded w-40 animate-pulse" />
                </td>
                <td className="p-4">
                  <div className="h-4 bg-muted-foreground/20 rounded w-24 animate-pulse" />
                </td>
                <td className="p-4">
                  <div className="h-4 bg-muted-foreground/20 rounded w-20 animate-pulse" />
                </td>
                <td className="p-4">
                  <div className="h-5 bg-muted-foreground/20 rounded-full w-16 animate-pulse" />
                </td>
                <td className="p-4">
                  <div className="h-4 bg-muted-foreground/20 rounded w-20 animate-pulse" />
                </td>
                <td className="p-4">
                  <div className="h-4 bg-muted-foreground/20 rounded w-16 animate-pulse font-mono" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}