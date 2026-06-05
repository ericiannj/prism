import { NavLink } from "react-router-dom";

export function Nav() {
  return (
    <nav className="flex items-center justify-between px-6 h-14 border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-primary" />
        <span className="text-sm font-semibold tracking-tight">Prism</span>
      </div>
      <div className="flex items-center gap-1">
        <NavLink
          to="/documents"
          className={({ isActive }) =>
            isActive
              ? "px-3 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground"
              : "px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          }
        >
          Documents
        </NavLink>
        <NavLink
          to="/chat"
          className={({ isActive }) =>
            isActive
              ? "px-3 py-1.5 rounded-md text-sm font-medium bg-primary text-primary-foreground"
              : "px-3 py-1.5 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          }
        >
          Chat
        </NavLink>
      </div>
    </nav>
  );
}
