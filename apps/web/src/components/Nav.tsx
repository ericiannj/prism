import { Link, NavLink, useNavigate } from "react-router-dom";
import { authClient } from "../lib/auth-client";

function PrismIcon() {
  return (
    <div className="relative w-5 h-[18px] flex-shrink-0" aria-hidden="true">
      <div className="absolute inset-0 [clip-path:polygon(50%_0%,0%_100%,100%_100%)] bg-[hsl(263,75%,28%)]" />
      <div className="absolute inset-0 [clip-path:polygon(50%_0%,0%_100%,37%_100%)] bg-[hsl(263,78%,65%)]" />
      <div className="absolute inset-0 [clip-path:polygon(50%_0%,37%_100%,63%_100%)] bg-[hsl(278,70%,76%)]" />
    </div>
  );
}

const base = "relative px-3 py-[5px] rounded-md text-[13px] transition-colors";
const active =
  base +
  " font-semibold text-foreground bg-primary/10" +
  " after:content-[''] after:absolute after:bottom-0.5 after:left-3 after:right-3 after:h-0.5 after:bg-primary after:rounded-[1px]";
const inactive = base + " font-medium text-muted-foreground hover:text-foreground";

export function Nav() {
  const { data: session } = authClient.useSession();
  const navigate = useNavigate();

  async function handleLogout() {
    await authClient.signOut();
    navigate("/login");
  }

  return (
    <nav className="flex items-center justify-between px-8 h-[52px] border-b border-border bg-background/85 backdrop-blur-[12px] sticky top-0 z-10">
      <Link to="/" className="flex items-center gap-[9px]">
        <PrismIcon />
        <span className="text-[11px] font-extrabold tracking-[0.16em] uppercase text-foreground">
          Prism
        </span>
      </Link>
      <div className="flex items-center gap-1">
        <NavLink to="/" end className={({ isActive }) => (isActive ? active : inactive)}>
          Home
        </NavLink>
        <NavLink to="/documents" className={({ isActive }) => (isActive ? active : inactive)}>
          Documents
        </NavLink>
        <NavLink to="/chat" className={({ isActive }) => (isActive ? active : inactive)}>
          Chat
        </NavLink>
      </div>
      {session && (
        <button
          onClick={handleLogout}
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          Sign out
        </button>
      )}
    </nav>
  );
}
