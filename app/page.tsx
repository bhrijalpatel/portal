import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  Shield,
  Users,
  Wrench,
  Car,
  ClipboardCheck,
} from "lucide-react";
import { ThemeToggle } from "@/components/context/ThemeToggle";
import { Logo } from "@/components/icon/Logo";

export default function HomePage() {
  return (
    <div className="from-background via-background to-secondary/5 relative flex min-h-screen flex-col overflow-hidden bg-gradient-to-br">
      {/* Enhanced decorative elements */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="bg-primary/10 absolute top-1/4 left-1/5 h-96 w-96 animate-pulse rounded-full blur-3xl" />
        <div className="absolute right-1/5 bottom-1/4 h-80 w-80 animate-pulse rounded-full bg-sky-500/10 blur-3xl delay-1000" />
        <div className="absolute top-3/4 left-1/3 h-64 w-64 animate-pulse rounded-full bg-violet-500/10 blur-3xl delay-500" />
      </div>

      <header className="flex w-full items-center justify-between px-6 py-6 md:px-12">
        <Logo />
        <nav className="flex items-center gap-3">
          <Button asChild variant="ghost" className="hover:bg-primary/5">
            <Link href="/sign-up" className="flex items-center gap-2">
              Sign Up
            </Link>
          </Button>
          <ThemeToggle />
        </nav>
      </header>

      <main className="mx-auto flex max-w-6xl flex-1 flex-col items-center px-6 pt-16 text-center md:px-12 md:pt-24">
        {/* Hero Section */}
        <div className="relative">
          <div className="from-primary/20 absolute -inset-4 rounded-2xl bg-gradient-to-r via-blue-500/20 to-purple-500/20 opacity-30 blur-xl"></div>
          <h1 className="from-foreground via-primary relative bg-gradient-to-br to-blue-600 bg-clip-text text-5xl leading-tight font-black tracking-tight text-transparent md:text-7xl">
            Workshop
            <br />
            <span className="from-primary bg-gradient-to-r via-blue-500 to-purple-500 bg-clip-text text-transparent">
              Management Portal
            </span>
          </h1>
        </div>

        <p className="text-muted-foreground mt-8 max-w-3xl text-lg leading-relaxed md:text-xl">
          Streamline your automotive workshop operations with secure access to
          service records, inventory management, and team collaboration tools.
        </p>

        <div className="group mt-10 flex flex-col items-center gap-3 rounded-2xl border p-3 shadow sm:flex-row">
          <Button asChild size="lg" variant="outline">
            <Link href="/sign-in" className="flex items-center gap-2">
              Access Dashboard
              <ArrowRight className="size-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </Button>
          <div className="text-muted-foreground flex items-center gap-2 text-sm transition-all duration-300 group-hover:text-emerald-600">
            <Shield className="size-4" />
            <span>Secure team access</span>
          </div>
        </div>

        {/* Stats/Features Bar */}
        <div className="mt-16 grid w-full max-w-3xl grid-cols-1 gap-8 sm:grid-cols-3">
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
          <h2 className="mb-4 text-3xl font-bold md:text-4xl">
            Built for Automotive Workshops
          </h2>
          <p className="text-muted-foreground mx-auto mb-12 max-w-2xl text-lg">
            Comprehensive tools designed specifically for workshop operations
            and team management.
          </p>

          <div className="grid w-full grid-cols-1 gap-8 sm:gap-10 md:grid-cols-2 lg:grid-cols-3">
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

      <footer className="border-border mt-32 flex flex-col gap-3 border-t py-6 text-center">
        <p className="text-muted-foreground text-sm">
          &copy; {new Date().getFullYear()} Portal. Secure access for your
          automotive business.
        </p>
        <p className="text-muted-foreground text-sm">
          Built by{" "}
          <Link
            href="https://pateltrading.biz"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-primary underline transition-colors"
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
  icon: React.ElementType;
  value: string;
  label: string;
}) {
  return (
    <div className="bg-card/50 border-border/50 hover:border-primary/20 rounded-xl border p-6 text-center backdrop-blur-sm transition-colors">
      <Icon className="text-primary mx-auto mb-3 size-8" />
      <div className="text-foreground text-2xl font-bold">{value}</div>
      <div className="text-muted-foreground text-sm">{label}</div>
    </div>
  );
}

function FeatureCard({
  icon: Icon,
  title,
  description,
  highlight,
}: {
  icon: React.ElementType;
  title: string;
  description: string;
  highlight: string;
}) {
  return (
    <div className="group bg-card/50 border-border/50 hover:border-primary/20 relative rounded-2xl border p-8 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <div className="from-primary/5 absolute inset-0 rounded-2xl bg-gradient-to-br to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"></div>
      <div className="relative">
        <div className="mb-4 flex items-center gap-3">
          <div className="bg-primary/10 group-hover:bg-primary/15 rounded-xl p-3 transition-colors">
            <Icon className="text-primary size-6" />
          </div>
          <span className="text-primary text-xs font-semibold tracking-wider uppercase">
            {highlight}
          </span>
        </div>
        <h3 className="text-foreground group-hover:text-primary mb-3 text-xl font-bold transition-colors">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm leading-relaxed">
          {description}
        </p>
      </div>
    </div>
  );
}
