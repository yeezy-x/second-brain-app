import { Link, Navigate } from "react-router-dom";
import {
  ArrowRight,
  Bookmark,
  FileText,
  Link2,
  Search,
  Share2,
  Sparkles,
  Tag,
  Video,
  X,
  Zap,
} from "lucide-react";

import { Logo } from "@/components/Logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuthStore } from "@/store/auth-store";

const FEATURES = [
  {
    icon: Zap,
    title: "Capture in seconds",
    description:
      "Save tweets, videos, documents, and links the moment inspiration strikes — no friction, no tabs.",
  },
  {
    icon: Tag,
    title: "Organize your way",
    description:
      "Tag everything with your own taxonomy. Filter by type, tag, or keyword in one click.",
  },
  {
    icon: Search,
    title: "Find instantly",
    description:
      "Full-text search across your entire library. That article from six months ago? Found.",
  },
  {
    icon: Share2,
    title: "Share selectively",
    description:
      "Generate a public read-only link for your collection — perfect for portfolios and reading lists.",
  },
] as const;

const CONTENT_TYPES = [
  { icon: X, label: "Tweets", color: "from-sky-400/20 to-sky-600/5" },
  { icon: Video, label: "Videos", color: "from-violet-400/20 to-violet-600/5" },
  { icon: FileText, label: "Documents", color: "from-amber-400/20 to-amber-600/5" },
  { icon: Link2, label: "Links", color: "from-emerald-400/20 to-emerald-600/5" },
] as const;

const STEPS = [
  { step: "01", title: "Save", text: "Paste a URL or add a note. We fetch the metadata automatically." },
  { step: "02", title: "Tag", text: "Label it with tags so your future self can find it in seconds." },
  { step: "03", title: "Recall", text: "Search, filter, or share — your second brain is always ready." },
] as const;

export default function LandingPage() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  if (hasHydrated && isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[520px] w-[720px] -translate-x-1/2 rounded-full bg-accent/10 blur-[120px]" />
        <div className="absolute top-[40%] -left-32 h-[400px] w-[400px] rounded-full bg-indigo-500/10 blur-[100px]" />
        <div className="absolute bottom-0 right-0 h-[360px] w-[360px] rounded-full bg-accent/5 blur-[90px]" />
        <div className="grain absolute inset-0" />
      </div>

      <header className="sticky top-0 z-50 border-b border-border/60 glass">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <Link to="/" className="transition-opacity hover:opacity-90">
            <Logo />
          </Link>
          <nav className="flex items-center gap-2 sm:gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link to="/login">Sign in</Link>
            </Button>
            <Button size="sm" asChild>
              <Link to="/signup">
                Get started
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto max-w-6xl px-6 pb-24 pt-16 sm:pt-24">
          <div className="grid items-center gap-14 lg:grid-cols-[1fr_1.05fr] lg:gap-16">
            <div className="animate-fade-in">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-bg-elev/80 px-3 py-1 text-xs text-muted-fg">
                <Sparkles className="h-3.5 w-3.5 text-accent" />
                Your personal knowledge OS
              </div>
              <h1 className="font-display text-4xl font-semibold leading-[1.08] tracking-tight text-fg sm:text-5xl lg:text-[3.4rem]">
                Remember everything.
                <span className="block bg-linear-to-r from-accent via-cyan-300 to-indigo-400 bg-clip-text text-transparent">
                  Find anything.
                </span>
              </h1>
              <p className="mt-5 max-w-lg text-base leading-relaxed text-muted-fg sm:text-lg">
                Second Brain is a quiet place for everything you don&apos;t want to forget —
                tweets, videos, links, and notes, organized and searchable in one beautiful space.
              </p>
              <div className="mt-8 flex flex-wrap items-center gap-3">
                <Button size="lg" asChild>
                  <Link to="/signup">
                    Start for free
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/login">I already have an account</Link>
                </Button>
              </div>
              <p className="mt-6 text-xs text-muted-fg/80">
                No credit card · Your data, your backend · Built for thinkers
              </p>
            </div>

            <div className="relative animate-fade-in [animation-delay:120ms]">
              <div className="absolute -inset-4 rounded-2xl bg-linear-to-br from-accent/20 via-transparent to-indigo-500/20 blur-2xl" />
              <HeroPreview />
            </div>
          </div>
        </section>

        {/* Content types */}
        <section className="border-y border-border/60 bg-bg-elev/30 py-14">
          <div className="mx-auto max-w-6xl px-6">
            <p className="text-center text-[11px] uppercase tracking-[0.22em] text-muted-fg">
              Save anything
            </p>
            <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
              {CONTENT_TYPES.map(({ icon: Icon, label, color }) => (
                <div
                  key={label}
                  className={`group flex flex-col items-center gap-3 rounded-xl border border-border bg-linear-to-b ${color} p-6 transition-colors hover:border-accent/30`}
                >
                  <div className="grid h-11 w-11 place-items-center rounded-lg border border-border bg-bg-elev/80 text-muted-fg transition-colors group-hover:text-accent">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="text-sm font-medium text-fg">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
              Built for how you actually think
            </h2>
            <p className="mt-4 text-muted-fg">
              Not another bloated note app. A focused tool to capture, organize, and recall —
              without the noise.
            </p>
          </div>
          <div className="mt-14 grid gap-4 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, title, description }, i) => (
              <Card
                key={title}
                className="group border-border/80 bg-bg-elev/50 transition-all hover:border-accent/25 hover:bg-bg-elev/80"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <CardContent className="p-6">
                  <div className="mb-4 grid h-10 w-10 place-items-center rounded-lg border border-border bg-accent-soft text-accent transition-transform group-hover:scale-105">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-display text-lg font-semibold text-fg">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-fg">{description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section className="border-t border-border/60 bg-bg-elev/20 py-24">
          <div className="mx-auto max-w-6xl px-6">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="font-display text-3xl font-semibold tracking-tight text-fg">
                Three steps to a sharper mind
              </h2>
            </div>
            <div className="mt-14 grid gap-6 md:grid-cols-3">
              {STEPS.map(({ step, title, text }) => (
                <div key={step} className="relative rounded-xl border border-border bg-bg-elev/40 p-6">
                  <span className="font-mono text-xs text-accent">{step}</span>
                  <h3 className="mt-3 font-display text-xl font-semibold text-fg">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-fg">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="mx-auto max-w-6xl px-6 py-24">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-linear-to-br from-bg-elev via-bg-elev-2 to-bg-elev p-10 sm:p-14">
            <div className="grain absolute inset-0" />
            <div className="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-accent/15 blur-3xl" />
            <div className="relative z-10 mx-auto max-w-xl text-center">
              <Bookmark className="mx-auto h-8 w-8 text-accent" />
              <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-fg sm:text-4xl">
                Your second brain is one click away
              </h2>
              <p className="mt-3 text-muted-fg">
                Join and start saving the ideas, links, and resources you&apos;ll actually use.
              </p>
              <div className="mt-8 flex flex-wrap justify-center gap-3">
                <Button size="lg" asChild>
                  <Link to="/signup">
                    Create your account
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/60 py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 sm:flex-row">
          <Logo withWordmark={false} />
          <p className="text-xs text-muted-fg">
            © {new Date().getFullYear()} Second Brain · Capture · Find · Share
          </p>
        </div>
      </footer>
    </div>
  );
}

function HeroPreview() {
  const items = [
    { type: "tweet", title: "Thread on system design patterns", tag: "engineering" },
    { type: "video", title: "Building a second brain — full walkthrough", tag: "productivity" },
    { type: "link", title: "The Art of Learning — Josh Waitzkin", tag: "books" },
  ] as const;

  const icons = { tweet: X, video: Video, link: Link2, document: FileText };

  return (
    <div className="relative rounded-2xl border border-border bg-bg-elev/80 p-4 shadow-[0_24px_80px_-20px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:p-5">
      <div className="mb-4 flex items-center justify-between border-b border-border/70 pb-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.18em] text-muted-fg">Dashboard</p>
          <p className="font-display text-sm font-semibold text-fg">Everything</p>
        </div>
        <div className="flex gap-1.5">
          <span className="h-2.5 w-2.5 rounded-full bg-danger/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-warn/70" />
          <span className="h-2.5 w-2.5 rounded-full bg-success/70" />
        </div>
      </div>

      <div className="mb-3 flex gap-2">
        <div className="h-8 flex-1 rounded-md border border-border bg-bg-elev-2/80 px-3 text-xs leading-8 text-muted-fg">
          Search your library…
        </div>
        <div className="grid h-8 w-8 place-items-center rounded-md bg-accent text-accent-fg">
          <Search className="h-3.5 w-3.5" />
        </div>
      </div>

      <ul className="space-y-2.5">
        {items.map((item, i) => {
          const Icon = icons[item.type];
          return (
            <li
              key={item.title}
              className="animate-float rounded-lg border border-border bg-bg-elev/90 p-3 transition-transform hover:border-accent/20"
              style={{ animationDelay: `${i * 400}ms` }}
            >
              <div className="flex items-start gap-3">
                <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md border border-border bg-bg-elev-2 text-muted-fg">
                  <Icon className="h-3.5 w-3.5" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-fg">{item.title}</p>
                  <span className="mt-1 inline-block rounded-full bg-accent-soft px-2 py-0.5 text-[10px] text-accent">
                    #{item.tag}
                  </span>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
