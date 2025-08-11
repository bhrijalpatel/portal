import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Shield,
  Sparkles,
  Users,
  Wrench,
  Car,
  ClipboardCheck,
} from "lucide-react";
import ThemeToggle from "@/components/context/ThemeToggle";

export default function HomePage() {
  return (
    <div className="relative min-h-screen flex flex-col overflow-hidden bg-gradient-to-br from-background via-background to-secondary/5">
      {/* Enhanced decorative elements */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute top-1/4 left-1/5 h-96 w-96 rounded-full bg-primary/10 blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 right-1/5 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-3/4 left-1/3 h-64 w-64 rounded-full bg-purple-500/10 blur-3xl animate-pulse delay-500" />
      </div>

      <header className="w-full flex items-center justify-between px-6 py-6 md:px-12">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-xl font-bold tracking-tight">Portal</span>
        </div>
        <nav className="flex items-center gap-3">
          <Button
            asChild
            variant="ghost"
            size="sm"
            className="hover:bg-primary/5"
          >
            <Link href="/sign-up" className="flex items-center gap-2">
              Sign Up
            </Link>
          </Button>
          <ThemeToggle />
        </nav>
      </header>

      <main className="flex-1 px-6 md:px-12 flex flex-col items-center text-center max-w-6xl mx-auto pt-16 md:pt-24">
        {/* Hero Section */}
        <div className="relative">
          <div className="absolute -inset-4 bg-gradient-to-r from-primary/20 via-blue-500/20 to-purple-500/20 rounded-2xl blur-xl opacity-30"></div>
          <h1 className="relative text-5xl md:text-7xl font-black tracking-tight bg-gradient-to-br from-foreground via-primary to-blue-600 bg-clip-text text-transparent leading-tight">
            Workshop
            <br />
            <span className="bg-gradient-to-r from-primary via-blue-500 to-purple-500 bg-clip-text text-transparent">
              Management Portal
            </span>
          </h1>
        </div>

        <p className="mt-8 text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
          Streamline your automotive workshop operations with secure access to
          service records, inventory management, and team collaboration tools.
        </p>

        <div className="mt-10 flex flex-col sm:flex-row gap-3 items-center border rounded-2xl p-3 shadow group">
          <Button asChild size="lg" variant="outline">
            <Link href="/sign-in" className="flex items-center gap-2">
              Access Dashboard
              <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </Button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground group-hover:text-emerald-600 transition-all duration-300">
            <Shield className="h-4 w-4" />
            <span>Secure team access</span>
          </div>
        </div>

        {/* Stats/Features Bar */}
        <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8 w-full max-w-3xl">
          <StatCard icon={Car} value="500+" label="Vehicles Serviced" />
          <StatCard icon={Wrench} value="24/7" label="System Access" />
          <StatCard
            icon={ClipboardCheck}
            value="100%"
            label="Digital Records"
          />
        </div>

        {/* Feature Showcase */}
        <div className="mt-24 w-full">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Built for Automotive Workshops
          </h2>
          <p className="text-lg text-muted-foreground mb-12 max-w-2xl mx-auto">
            Comprehensive tools designed specifically for workshop operations
            and team management.
          </p>

          <div className="grid gap-8 sm:gap-10 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 w-full">
            <FeatureCard
              icon={ClipboardCheck}
              title="Service Management"
              description="Track service history, maintenance schedules, and customer information with secure digital records."
              highlight="Streamlined workflow"
            />
            <FeatureCard
              icon={Wrench}
              title="Inventory Control"
              description="Monitor parts availability, track usage, and manage supplier information in real-time."
              highlight="Always stocked"
            />
            <FeatureCard
              icon={Users}
              title="Team Collaboration"
              description="Secure role-based access for technicians, managers, and administrative staff."
              highlight="Work together"
            />
          </div>
        </div>
      </main>

      <footer className="mt-32 py-6 flex flex-col gap-3 border-t border-border text-center">
        <p className="text-sm text-muted-foreground">
          &copy; {new Date().getFullYear()} Portal. Secure access for your
          automotive business.
        </p>
        <p className="text-sm text-muted-foreground">
          Built by{" "}
          <Link
            href="https://pateltrading.biz"
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-primary transition-colors"
          >
            Patel Trading Company (1961) Limited
          </Link>
        </p>
      </footer>
    </div>
  );
}

function StatCard({
  icon: Icon,
  value,
  label,
}: {
  icon: any;
  value: string;
  label: string;
}) {
  return (
    <div className="text-center p-6 rounded-xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/20 transition-colors">
      <Icon className="h-8 w-8 text-primary mx-auto mb-3" />
      <div className="text-2xl font-bold text-foreground">{value}</div>
      <div className="text-sm text-muted-foreground">{label}</div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  highlight,
}: {
  icon: any;
  title: string;
  description: string;
  highlight: string;
}) {
  return (
    <div className="group relative p-8 rounded-2xl bg-card/50 backdrop-blur-sm border border-border/50 hover:border-primary/20 transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
      <div className="relative">
        <div className="mb-4 flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10 group-hover:bg-primary/15 transition-colors">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <span className="text-xs font-semibold uppercase tracking-wider text-primary">
            {highlight}
          </span>
        </div>
        <h3 className="text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
          {title}
        </h3>
        <p className="text-sm leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>
    </div>
  );
}
