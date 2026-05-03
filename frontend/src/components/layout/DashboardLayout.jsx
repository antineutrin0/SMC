import { useState } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import {
  LogOut,
  Home,
  User,
  Menu,
  X,
  Stethoscope,
  Calendar,
  FileText,
  Pill,
  Ambulance,
  Users,
  Package,
  Activity,
} from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";

const NAV_BY_ROLE = {
  Patient: [
    { label: "Profile", path: "/dashboard", icon: User },
    { label: "Visit History", path: "/dashboard/visits", icon: Calendar },
    {
      label: "First Aid Requests",
      path: "/dashboard/firstaid",
      icon: Ambulance,
    },
  ],
  Doctor: [
    { label: "Patient Visits", path: "/dashboard", icon: Stethoscope },
    { label: "Medicines", path: "/dashboard/medicines", icon: Pill },
    { label: "First Aid Requests", path: "/dashboard/firstaid", icon: Ambulance },
  ],
  Nurse: [
    { label: "Pending Tokens", path: "/dashboard", icon: Pill },
    { label: "Dispensing History", path: "/dashboard/history", icon: FileText },
    { label: "Medicine Requests", path: "/dashboard/requests", icon: Package },
  ],
  Registrar: [
    { label: "Inventory", path: "/dashboard", icon: Pill },
    { label: "Transactions", path: "/dashboard/transactions", icon: Activity },
    {
      label: "First Aid Requests",
      path: "/dashboard/firstaidrequest",
      icon: Package,
    },
  ],
  Driver: [{ label: "Service Logs", path: "/dashboard", icon: Ambulance }],
  Admin: [
    { label: "Overview", path: "/dashboard", icon: Activity },
    { label: "Employees", path: "/dashboard/employees", icon: Users },
    { label: "Rosters", path: "/dashboard/rosters", icon: Calendar },
    { label: "Applications", path: "/dashboard/applications", icon: FileText },
  ],
};

function Sidebar({ open, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const navItems = NAV_BY_ROLE[user?.type] || [];
  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 z-30 h-full w-64 bg-white border-r flex flex-col transform transition-transform duration-200
          ${open ? "translate-x-0" : "-translate-x-full"} lg:translate-x-0 lg:static lg:z-auto`}
      >
        {/* Logo */}
        <div className="flex items-center justify-between p-4 border-b">
          <Link to="/" className="flex items-center gap-2 group">
            <img
              src="https://i.ibb.co.com/RT3Wn4W9/SUST-logo.png"
              alt="SUST-logo"
              className="w-6 h-6"
            />
            <span className="font-semibold text-sm leading-tight">
              SUST Medical
              <br />
              Centre
            </span>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded hover:bg-gray-100"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Info */}
        <div className="px-4 py-3 bg-blue-50 border-b">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
              {(user?.fullname || user?.id || "?").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">
                {user?.fullname || user?.id}
              </p>
              <Badge variant="outline" className="text-xs mt-0.5">
                {user?.type}
              </Badge>
            </div>
          </div>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors
                  ${
                    isActive
                      ? "bg-blue-600 text-white font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Bottom Actions */}
        <div className="p-3 border-t space-y-1">
          <Link
            to="/"
            onClick={onClose}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors"
          >
            <Home className="w-4 h-4" />
            Home Page
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>
    </>
  );
}

export function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <header className="bg-white border-b px-4 py-3 flex items-center gap-3 lg:hidden shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-1.5 rounded-lg hover:bg-gray-100"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Stethoscope className="w-5 h-5 text-blue-600" />
            <span className="font-semibold text-sm">SUST Medical Centre</span>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}
