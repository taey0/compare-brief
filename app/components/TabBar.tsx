"use client";

import { usePathname, useRouter } from "next/navigation";
import { IconHome, IconExplore, IconHistory, IconSettings } from "./Icons";

const TABS = [
  { id: "home", label: "Home", path: "/", icon: IconHome },
  { id: "explore", label: "Explore", path: "/explore", icon: IconExplore },
  { id: "history", label: "History", path: "/history", icon: IconHistory },
  { id: "settings", label: "Settings", path: "/settings", icon: IconSettings },
];

export default function TabBar() {
  const pathname = usePathname();
  const router = useRouter();

  return (
    <nav className="tab-bar">
      {TABS.map((tab) => (
        <button
          key={tab.id}
          className={`tab-item ${pathname === tab.path ? "active" : ""}`}
          onClick={() => router.push(tab.path)}
        >
          <tab.icon />
          {tab.label}
        </button>
      ))}
    </nav>
  );
}
