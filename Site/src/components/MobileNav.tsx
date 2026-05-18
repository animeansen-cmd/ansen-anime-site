import { Link, useLocation } from "react-router-dom";
import { Home, List, Calendar, Tag, User } from "lucide-react";

const tabs = [
  { icon: Home, label: "Início", path: "/" },
  { icon: List, label: "Animes", path: "/" },
  { icon: Calendar, label: "Calendário", path: "/calendar" },
  { icon: Tag, label: "Gêneros", path: "/genres" },
  { icon: User, label: "Perfil", path: "/" },
];

const MobileNav = () => {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass md:hidden">
      <div className="flex items-center justify-around h-16">
        {tabs.map((tab) => {
          const active = pathname === tab.path;
          return (
            <Link
              key={tab.label}
              to={tab.path}
              className={`flex flex-col items-center gap-1 text-xs transition-colors ${
                active ? "text-primary" : "text-muted-foreground"
              }`}
            >
              <tab.icon size={20} />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default MobileNav;
