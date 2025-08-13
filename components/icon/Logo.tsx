import { Sparkle } from "lucide-react";

export const Logo = () => {
  return (
    <div className="flex items-center gap-2">
      <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
        <Sparkle className="h-4 w-4 text-primary-foreground" />
      </div>
      <span className="text-xl font-bold tracking-tight">Portal</span>
    </div>
  );
};
