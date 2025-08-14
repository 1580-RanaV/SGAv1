import { Target, Sparkles } from "lucide-react";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-200/60 shadow-sm">
      <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
        {/* Logo/Brand Section */}
        <div className="flex items-center gap-3 group">
          <div className="relative">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg group-hover:shadow-indigo-200 transition-all duration-300">
              <Target className="w-4 h-4 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-400 rounded-full flex items-center justify-center">
              <div className="w-1 h-1 bg-white rounded-full"></div>
            </div>
          </div>
          <div className="flex flex-col">
            <div className="font-bold text-lg bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent tracking-tighter font-inter">
              SGA
            </div>
            <div className="text-xs text-indigo-600 font-medium -mt-1 font-inter tracking-tighter">v1.0</div>
          </div>
        </div>

        {/* Center Description */}
        <div className="hidden md:flex items-center gap-2 px-4 py-2 bg-slate-50/80 rounded-full border border-slate-200/60">
          <Sparkles className="w-4 h-4 text-indigo-500" />
          <span className="text-sm font-medium text-slate-700 font-inter tracking-tighter">
            AI-powered resume gap analysis for job descriptions
          </span>
        </div>

        {/* Right Section - Status Indicator */}
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 rounded-full border border-emerald-200/60">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
            <span className="text-xs font-semibold text-emerald-700 tracking-tighter font-inter">
              ACTIVE
            </span>
          </div>
          
          {/* Mobile version of center description */}
          <div className="md:hidden">
            <Sparkles className="w-5 h-5 text-indigo-500" />
          </div>
        </div>
      </div>
      
      {/* Subtle gradient line */}
      <div className="h-px bg-gradient-to-r from-transparent via-indigo-200 to-transparent"></div>
    </header>
  );
}