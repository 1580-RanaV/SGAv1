import { Github, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
  return (
    <footer className="border-t border-slate-200/60 bg-white/95 backdrop-blur-md shadow-inner">
      <div className="mx-auto max-w-7xl px-6 py-8 flex flex-col md:flex-row items-center justify-between gap-4">
        
        {/* Logo + App name */}
        <div className="flex items-center gap-3">
          <div className="relative h-6 w-6">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-black" />
            <span className="absolute left-1/2 top-0 -translate-x-1/2 h-2.5 w-2.5 rounded-full bg-black" />
            <span className="absolute right-0 top-1/2 -translate-y-1/2 h-2.5 w-2.5 rounded-full bg-black" />
          </div>
          <span className="text-sm font-medium text-slate-600 tracking-tight">SGA v1.1</span>
        </div>

        {/* Copyright */}
        <p className="text-xs text-slate-500">
          © {new Date().getFullYear()} SGA App. All rights reserved. Made by Rana.
        </p>

        {/* Socials (optional) */}
        <div className="flex gap-4 text-slate-500">
          <a href="https://github.com/1580-RanaV" className="hover:text-slate-900 transition">
            <Github className="h-4 w-4" />
          </a>
          <a href="#" className="hover:text-slate-900 transition">
            <Twitter className="h-4 w-4" />
          </a>
          <a href="https://www.linkedin.com/in/vrana11/" className="hover:text-slate-900 transition">
            <Linkedin className="h-4 w-4" />
          </a>
        </div>
      </div>
    </footer>
  );
}
