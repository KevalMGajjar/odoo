import {
  LayoutDashboard,
  Truck,
  Users,
  Route,
  Wrench,
  Fuel,
  BarChart3,
  Settings,
  type LucideIcon,
} from "lucide-react";
import type { ModuleKey } from "@/lib/auth/rbac";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  module: ModuleKey;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard, module: "dashboard" },
  { href: "/vehicles", label: "Vehicle Registry", icon: Truck, module: "vehicles" },
  { href: "/drivers", label: "Drivers", icon: Users, module: "drivers" },
  { href: "/trips", label: "Trip Dispatcher", icon: Route, module: "trips" },
  { href: "/maintenance", label: "Maintenance", icon: Wrench, module: "maintenance" },
  { href: "/fuel", label: "Fuel & Expenses", icon: Fuel, module: "fuel" },
  { href: "/reports", label: "Reports", icon: BarChart3, module: "reports" },
  { href: "/settings", label: "Settings & RBAC", icon: Settings, module: "settings" },
];
