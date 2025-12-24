import Link from "next/link";
import { ArrowRight, TrendingUp, Zap, Shield, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white overflow-hidden">
      {/* Navigation */}
      <nav className="flex justify-between items-center px-6 md:px-12 py-6 border-b border-slate-800/50">
        <div className="text-2xl font-bold">FinBoard</div>
        <div className="hidden md:flex gap-8 text-sm text-slate-300">
          <a href="#how-it-works" className="hover:text-white transition">
            How it Works
          </a>
          <a href="#features" className="hover:text-white transition">
            Features
          </a>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center justify-center px-6 md:px-12 py-20">
        {/* Grid background effect */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />

        <div className="relative z-10 max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-slate-700 bg-slate-900/50">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-sm text-slate-300">
              Real-time Financial Intelligence
            </span>
          </div>

          <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-balance">
            Build Your Custom
            <span className="bg-gradient-to-r from-emerald-400 to-blue-500 bg-clip-text text-transparent">
              {" "}
              Finance Dashboard
            </span>
          </h1>

          <p className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto text-balance">
            Connect to multiple financial APIs, visualize real-time market data
            with customizable widgets, and manage your investment portfolio all
            in one powerful dashboard.
          </p>

          {/* Main CTA Button */}
          <div className="pt-8">
            <Link href="/dashboard">
              <Button
                size="lg"
                className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white font-semibold text-lg px-12 py-7 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 group"
              >
                Get Started
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>

          {/* Trust indicators */}
          <div className="pt-6 flex flex-col sm:flex-row items-center justify-center gap-4 text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-emerald-400" />
              <span>Enterprise Security</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-slate-700" />
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-blue-400" />
              <span>Real-time Updates</span>
            </div>
            <div className="hidden sm:block w-px h-4 bg-slate-700" />
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>Multiple APIs</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section
        id="how-it-works"
        className="py-20 px-6 md:px-12 border-t border-slate-800/50"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            How it Works
          </h2>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              {
                step: "01",
                title: "Add Widgets",
                description:
                  "Click 'Add Widget' to create customizable components for your financial data.",
              },
              {
                step: "02",
                title: "Configure Data",
                description:
                  "Connect your API endpoints and specify which fields to display in each widget.",
              },
              {
                step: "03",
                title: "Drag & Arrange",
                description:
                  "Drag widgets to rearrange your dashboard. Your layout is automatically saved.",
              },
            ].map((item, idx) => (
              <div key={idx} className="relative">
                <div className="text-6xl font-bold text-emerald-500/20 mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-3">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed">
                  {item.description}
                </p>
                {idx < 2 && (
                  <div className="hidden md:block absolute top-8 -right-6 w-12 h-px bg-gradient-to-r from-emerald-500/50 to-transparent" />
                )}
              </div>
            ))}
          </div>

          <div className="mt-16 p-8 rounded-xl border border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-start gap-4">
              <div className="w-2 h-2 rounded-full bg-emerald-500 mt-2" />
              <div>
                <h4 className="font-semibold mb-2 text-emerald-400">
                  Persistent Storage
                </h4>
                <p className="text-slate-400">
                  Your dashboard layout and configuration are automatically
                  saved to your browser's local storage. Refresh the page and
                  everything stays exactly as you left it.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section
        id="features"
        className="py-20 px-6 md:px-12 bg-slate-900/40 border-t border-slate-800/50"
      >
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold text-center mb-16">
            Powerful Features
          </h2>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: BarChart3,
                title: "Customizable Widgets",
                description:
                  "Build your perfect dashboard with drag-and-drop widgets for stocks, watchlists, and market data.",
              },
              {
                icon: Zap,
                title: "Real-time Data",
                description:
                  "Get live market updates with automatic refresh and intelligent caching for optimal performance.",
              },
              {
                icon: TrendingUp,
                title: "Multiple APIs",
                description:
                  "Connect to Alpha Vantage, Finnhub, and more. Visualize any financial data in seconds.",
              },
            ].map((feature, idx) => (
              <div
                key={idx}
                className="p-6 rounded-lg border border-slate-700/50 bg-slate-800/30 hover:border-slate-600 transition-colors group"
              >
                <feature.icon className="w-10 h-10 text-emerald-400 mb-4 group-hover:text-blue-400 transition-colors" />
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-6 md:px-12">
        <div className="max-w-4xl mx-auto text-center space-y-6 p-12 rounded-xl border border-slate-700/50 bg-gradient-to-br from-slate-800/30 to-slate-900/30">
          <h2 className="text-3xl md:text-4xl font-bold">
            Ready to Build Your Dashboard?
          </h2>
          <p className="text-lg text-slate-400">
            Start monitoring your investments in real-time with FinBoard today.
          </p>
          <Link href="/dashboard">
            <Button
              size="lg"
              className="bg-gradient-to-r from-emerald-500 to-blue-600 hover:from-emerald-600 hover:to-blue-700 text-white font-semibold px-10 py-6 rounded-full"
            >
              Launch Dashboard
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800/50 py-8 px-6 md:px-12 text-center text-slate-500 text-sm">
        <p>© 2025 FinBoard. All rights reserved.</p>
      </footer>
    </main>
  );
}
