import Link from "next/link";
import { ArrowRight, Shield, Zap, Globe, BarChart3, Leaf, TreePine, Factory, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getGlobalStats } from "@/db/queries";

const features = [
  {
    icon: Shield,
    title: "Verified Carbon Offsets",
    description:
      "Every credit is verified through satellite imagery and IoT sensors before minting on-chain.",
  },
  {
    icon: Zap,
    title: "Instant Settlement",
    description:
      "Trade credits in real-time on Polygon. Sub-second finality with near-zero gas fees.",
  },
  {
    icon: Globe,
    title: "Global Impact Map",
    description:
      "Track the real-world impact of every project with our interactive geospatial dashboard.",
  },
  {
    icon: BarChart3,
    title: "Transparent Pricing",
    description:
      "Market-driven pricing with full on-chain transparency. No hidden fees or intermediaries.",
  },
];

const projectTypes = [
  { icon: TreePine, name: "Reforestation", color: "from-surge-orange to-surge-orange-dark" },
  { icon: Wind, name: "Renewable Energy", color: "from-cyan-500 to-teal-600" },
  { icon: Factory, name: "Industrial Capture", color: "from-violet-500 to-purple-600" },
  { icon: Leaf, name: "Conservation", color: "from-surge-orange to-surge-orange-dark" },
];

export const revalidate = 60; // ISR: revalidate every 60 seconds

export default async function HomePage() {
  // Fetch real stats from database
  const stats = await getGlobalStats();

  const displayStats = [
    {
      label: "Carbon Retired",
      value: stats.totalRetired > 0 ? stats.totalRetired.toLocaleString() : "0",
      suffix: "tons CO₂",
    },
    {
      label: "Active Projects",
      value: stats.totalProjects > 0 ? stats.totalProjects.toLocaleString() : "0",
      suffix: "worldwide",
    },
    {
      label: "Transactions",
      value: stats.totalTransactions > 0 ? stats.totalTransactions.toLocaleString() : "0",
      suffix: "total",
    },
    {
      label: "Credits Issued",
      value: stats.totalCreditsIssued > 0 ? stats.totalCreditsIssued.toLocaleString() : "0",
      suffix: "tons CO₂",
    },
  ];

  return (
    <div className="relative">
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-grid">
        <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/8 blur-[120px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-surge-orange/10 blur-[100px] animate-float-delayed" />

        <div className="relative z-10 mx-auto max-w-6xl px-4 text-center">
          <div className="animate-fade-in-up block">
            <div className="animate-shimmer mb-8 inline-flex items-center gap-2 rounded-full border border-border/80 bg-card/80 px-4 py-1.5 text-sm text-primary backdrop-blur-xl shadow-sm">
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              Live on Polygon Amoy Testnet
            </div>
          </div>

          <h1 className="animate-fade-in-up delay-100 mb-6 text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            <span className="text-foreground">The Future of</span>
            <br />
            <span className="gradient-text">Carbon Markets</span>
          </h1>

          <p className="animate-fade-in-up delay-200 mx-auto mb-10 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Tokenize verified carbon offsets as ERC-1155 assets. Trade on a transparent,
            permissionless marketplace. Retire credits and generate immutable certificates
            of impact.
          </p>

          <div className="animate-fade-in-up delay-300 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/marketplace">
              <Button
                size="lg"
                className="h-12 px-8 bg-gradient-to-r from-surge-orange to-surge-orange-dark text-white font-semibold shadow-lg shadow-surge-orange/20 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] hover:from-surge-orange-dark hover:to-surge-orange-dark hover:shadow-surge-orange/40"
              >
                Explore Marketplace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 border-border text-foreground hover:bg-accent hover:border-primary/40 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] shadow-sm hover:shadow-md"
              >
                Submit a Project
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className="relative border-y border-border/70 bg-card/55 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-fade-in-up delay-400">
            {displayStats.map((stat, i) => (
              <div key={stat.label} className="eco-surface eco-ring-hover rounded-2xl p-5 text-center group transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
                <div className="text-3xl font-bold gradient-text transition-transform duration-300 group-hover:scale-105">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.suffix}</div>
                <div className="mt-0.5 text-xs text-muted-foreground/80">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Built for <span className="gradient-text">Enterprise Impact</span>
            </h2>
            <p className="mt-4 text-muted-foreground max-w-2xl mx-auto">
              Every feature designed to bring trust, speed, and transparency to the
              voluntary carbon market.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="eco-surface eco-ring-hover group relative rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-gradient-to-br from-primary/15 to-surge-orange/10 transition-all duration-300 group-hover:border-primary/45 group-hover:scale-110 group-hover:shadow-[0_0_20px_rgba(224,120,80,0.2)]">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24 border-t border-border/70">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Explore <span className="gradient-text">Carbon Verticals</span>
            </h2>
            <p className="mt-4 text-muted-foreground">
              From forests to factories — diversified carbon offset categories.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {projectTypes.map((type) => (
              <Link href="/marketplace" key={type.name}>
                <div className="eco-surface eco-ring-hover group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:-translate-y-2 hover:shadow-xl cursor-pointer">
                  <div
                    className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${type.color} shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}
                  >
                    <type.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-1">
                    {type.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">Explore live listings</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="relative py-24 border-t border-border/70">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-primary/6 to-transparent" />
        <div className="relative mx-auto max-w-3xl text-center px-4">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl mb-4">
            Ready to make an <span className="gradient-text">impact</span>?
          </h2>
          <p className="text-muted-foreground mb-8 max-w-xl mx-auto">
            Connect your wallet, browse verified projects, and start building your
            carbon offset portfolio today.
          </p>
          <Link href="/marketplace">
            <Button
              size="lg"
              className="h-12 px-10 bg-gradient-to-r from-surge-orange to-surge-orange-dark text-white font-semibold shadow-lg shadow-surge-orange/20 transition-all duration-300 hover:-translate-y-1 hover:scale-[1.02] active:scale-[0.98] hover:from-surge-orange-dark hover:to-surge-orange-dark hover:shadow-surge-orange/40"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Button>
          </Link>
        </div>
      </section>

      <footer className="border-t border-border/70 bg-background/70 backdrop-blur">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-surge-orange" />
              <span className="font-semibold gradient-text">EcoChain</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 EcoChain. Built on Polygon. Verified by science.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
