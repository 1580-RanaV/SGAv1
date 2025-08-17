import { Target, Sparkles } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-center">
        {/* Logo + Brand */}
        <div className="flex items-center gap-3">
          {/* Three-dot logo */}
          <div className="relative h-8 w-8">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-black" />
            <span className="absolute left-1/2 top-0 -translate-x-1/2 h-3.5 w-3.5 rounded-full bg-black" />
            <span className="absolute right-0 top-1/2 -translate-y-1/2 h-3.5 w-3.5 rounded-full bg-black" />
          </div>

          {/* App name */}
          <div className="font-inter tracking-tighter">
            <span className="text-3xl font-bold text-slate-900">SGA v1.1</span>
          </div>
        </div>
      </div>

      {/* Subtle gradient divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent" />
    </header>
  );
}
