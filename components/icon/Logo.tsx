import { Sparkle } from "lucide-react";

export const Logo = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="p-2 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
        <Sparkle className="h-4 w-4 text-primary-foreground" />
      </div>
      <span className="font-extrabold tracking-wide uppercase">Portal</span>
    </div>
  );
};
