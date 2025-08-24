import { Sparkle } from "lucide-react";

export const Logo = () => {
  return (
    <div className="flex items-center gap-3">
      <div className="from-primary to-primary/70 flex items-center justify-center rounded-lg bg-gradient-to-br p-2">
        <Sparkle className="text-primary-foreground size-4" />
      </div>
      <span className="font-extrabold tracking-wide uppercase">Portal</span>
    </div>
  );
};
