import Link from "next/link";
import { ArrowRight, Shield, Zap, Globe, BarChart3, Leaf, TreePine, Factory, Wind } from "lucide-react";
import { Button } from "@/components/ui/button";

const stats = [
  { label: "Carbon Retired", value: "12,450+", suffix: "tons CO₂" },
  { label: "Active Projects", value: "340+", suffix: "worldwide" },
  { label: "Transactions", value: "$4.2M+", suffix: "volume" },
  { label: "Companies", value: "89+", suffix: "onboarded" },
];

const features = [
  {
    icon: Shield,
    title: "Verified Carbon Offsets",
    description: "Every credit is verified through satellite imagery and IoT sensors before minting on-chain.",
  },
  {
    icon: Zap,
    title: "Instant Settlement",
    description: "Trade credits in real-time on Polygon. Sub-second finality with near-zero gas fees.",
  },
  {
    icon: Globe,
    title: "Global Impact Map",
    description: "Track the real-world impact of every project with our interactive geospatial dashboard.",
  },
  {
    icon: BarChart3,
    title: "Transparent Pricing",
    description: "Market-driven pricing with full on-chain transparency. No hidden fees or intermediaries.",
  },
];

const projectTypes = [
  { icon: TreePine, name: "Reforestation", projects: 124, color: "from-emerald-500 to-green-600" },
  { icon: Wind, name: "Renewable Energy", projects: 89, color: "from-cyan-500 to-teal-600" },
  { icon: Factory, name: "Industrial Capture", projects: 67, color: "from-violet-500 to-purple-600" },
  { icon: Leaf, name: "Conservation", projects: 60, color: "from-lime-500 to-emerald-600" },
];

export default function HomePage() {
  return (
    <div className="relative">
      {/* ─── Hero Section ─── */}
      <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden bg-grid">
        {/* Gradient Orbs */}
        <div className="absolute top-1/4 left-1/4 h-[500px] w-[500px] rounded-full bg-emerald-500/5 blur-[120px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 h-[400px] w-[400px] rounded-full bg-green-500/5 blur-[100px] animate-float-delayed" />

        <div className="relative z-10 mx-auto max-w-6xl px-4 text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-emerald-500/20 bg-emerald-500/5 px-4 py-1.5 text-sm text-emerald-400 animate-shimmer">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live on Polygon Amoy Testnet
          </div>

          <h1 className="mb-6 text-5xl font-bold leading-tight tracking-tight sm:text-6xl lg:text-7xl">
            <span className="text-zinc-100">The Future of</span>
            <br />
            <span className="gradient-text">Carbon Markets</span>
          </h1>

          <p className="mx-auto mb-10 max-w-2xl text-lg text-zinc-400 leading-relaxed">
            Tokenize verified carbon offsets as ERC-1155 assets. Trade on a transparent,
            permissionless marketplace. Retire credits and generate immutable certificates
            of impact.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/marketplace">
              <Button
                size="lg"
                className="h-12 px-8 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300"
              >
                Explore Marketplace
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button
                size="lg"
                variant="outline"
                className="h-12 px-8 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all duration-300"
              >
                Submit a Project
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section className="relative border-y border-emerald-900/30 bg-[#0a0f0d]/80">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-3xl font-bold gradient-text">{stat.value}</div>
                <div className="mt-1 text-sm text-zinc-500">{stat.suffix}</div>
                <div className="mt-0.5 text-xs text-zinc-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="relative py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-zinc-100 sm:text-4xl">
              Built for <span className="gradient-text">Enterprise Impact</span>
            </h2>
            <p className="mt-4 text-zinc-500 max-w-2xl mx-auto">
              Every feature designed to bring trust, speed, and transparency to the voluntary carbon market.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group relative rounded-xl border border-emerald-900/20 bg-[#0a1210]/60 p-6 transition-all duration-300 hover:border-emerald-500/30 hover:bg-[#0a1a10]/80 hover:shadow-lg hover:shadow-emerald-500/5"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/10 to-green-600/10 border border-emerald-500/20 group-hover:border-emerald-500/40 transition-colors">
                  <feature.icon className="h-6 w-6 text-emerald-400" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-zinc-100">{feature.title}</h3>
                <p className="text-sm text-zinc-500 leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Project Types ─── */}
      <section className="relative py-24 border-t border-emerald-900/20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-zinc-100 sm:text-4xl">
              Explore <span className="gradient-text">Carbon Verticals</span>
            </h2>
            <p className="mt-4 text-zinc-500">
              From forests to factories — diversified carbon offset categories.
            </p>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {projectTypes.map((type) => (
              <Link href="/marketplace" key={type.name}>
                <div className="group relative overflow-hidden rounded-xl border border-emerald-900/20 bg-[#0a1210]/60 p-6 transition-all duration-300 hover:border-emerald-500/30 hover:translate-y-[-2px]">
                  <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br ${type.color} shadow-lg`}>
                    <type.icon className="h-7 w-7 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-100 mb-1">{type.name}</h3>
                  <p className="text-sm text-zinc-500">{type.projects} active projects</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─── */}
      <section className="relative py-24 border-t border-emerald-900/20">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/3 to-transparent" />
        <div className="relative mx-auto max-w-3xl text-center px-4">
          <h2 className="text-3xl font-bold text-zinc-100 sm:text-4xl mb-4">
            Ready to make an <span className="gradient-text">impact</span>?
          </h2>
          <p className="text-zinc-500 mb-8 max-w-xl mx-auto">
            Connect your wallet, browse verified projects, and start building your carbon offset portfolio today.
          </p>
          <Link href="/marketplace">
            <Button
              size="lg"
              className="h-12 px-10 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all duration-300"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="border-t border-emerald-900/20 bg-[#060a08]">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Leaf className="h-5 w-5 text-emerald-500" />
              <span className="font-semibold gradient-text">EcoChain</span>
            </div>
            <p className="text-sm text-zinc-600">
              © 2026 EcoChain. Built on Polygon. Verified by science.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
