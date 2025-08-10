import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-background via-background to-background">
      {/* Decorative gradient blur */}
      <div className="pointer-events-none absolute inset-0 -z-10 [mask-image:radial-gradient(circle_at_center,white,transparent)]">
        <div className="absolute top-1/3 left-1/4 h-72 w-72 rounded-full bg-primary/20 blur-3xl" />
        <div className="absolute bottom-10 right-1/4 h-72 w-72 rounded-full bg-secondary/30 blur-3xl" />
      </div>

      <header className="w-full flex items-center justify-between px-6 py-4 md:px-12">
        <div className="text-lg font-semibold tracking-tight">Portal</div>
        <nav className="flex items-center gap-3">
          <Button asChild variant="ghost" size="sm">
            <Link href="/sign-in">Sign In</Link>
          </Button>
          <Button asChild size="sm">
            <Link href="/sign-up">Get Started</Link>
          </Button>
        </nav>
      </header>

      <main className="flex-1 px-6 md:px-12 flex flex-col items-center text-center max-w-5xl mx-auto pt-10 md:pt-20">
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-b from-foreground to-foreground/70 bg-clip-text text-transparent">
          A Simple Auth Portal Starter
        </h1>
        <p className="mt-6 text-base md:text-lg text-muted-foreground max-w-2xl">
          Secure authentication, session management, and a clean UI foundation.
          Build your product faster with a modern stack and opinionated
          defaults.
        </p>
        <div className="mt-8 flex flex-col sm:flex-row gap-4">
          <Button asChild size="lg" className="px-8">
            <Link href="/sign-up">Create Account</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="px-8">
            <Link href="/sign-in">I already have an account</Link>
          </Button>
        </div>

        <div className="mt-16 grid gap-6 sm:gap-8 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 w-full">
          <FeatureCard
            title="Modern Stack"
            description="Next.js App Router, TypeScript, and Better Auth pre-wired."
          />
          <FeatureCard
            title="Secure Sessions"
            description="Robust auth flows with session handling and sign-out redirect."
          />
          <FeatureCard
            title="Rapid UI"
            description="Reusable components and utility classes accelerate iteration."
          />
        </div>
      </main>

      <footer className="mt-20 py-8 text-center text-xs text-muted-foreground">
        <p>&copy; {new Date().getFullYear()} Portal. All rights reserved.</p>
      </footer>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-lg border bg-card p-6 text-left shadow-sm backdrop-blur-sm">
      <h3 className="font-semibold mb-2 text-sm tracking-wide uppercase text-primary/80">
        {title}
      </h3>
      <p className="text-sm leading-relaxed text-muted-foreground">
        {description}
      </p>
    </div>
  );
}
