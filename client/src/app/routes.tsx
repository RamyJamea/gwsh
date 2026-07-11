import { createBrowserRouter, Navigate } from "react-router";
import { Login } from "./components/Login";
import { Pos } from "./components/Pos";
import { TableSelection } from "./components/TableSelection";
import { AdminLayout } from "./components/AdminLayout";
import { AdminDashboard } from "./components/AdminDashboard";

import { MenuManagement } from "./components/MenuManagement";
import { CatalogManagement } from "./components/CatalogManagement";
import { BranchMonitoring } from "./components/BranchMonitoring";
import { Orders } from "./components/Orders";
import { UserManagement } from "./components/UserManagement";
import { AppProvider } from "./store";
import { Outlet } from "react-router";
import { Toaster } from "./components/ui/sonner";
import { AuthProvider, useAuth } from "./auth-context";

// Protected Route Component
function ProtectedRoute({ allowedRoles, children }: { allowedRoles?: ("admin" | "cashier")[]; children: React.ReactNode }) {
  const { user, token, isLoading } = useAuth();

  if (isLoading) {
    return <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center text-stone-600 font-medium">Loading...</div>;
  }

  if (!token || !user) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to={user.role === "admin" ? "/admin/dashboard" : "/destination-selection"} replace />;
  }

  return <>{children}</>;
}

// Root wrapper to provide Context to all routes
function Root() {
  return (
    <AuthProvider>
      <AppProvider>
        <Outlet />
        <Toaster />
      </AppProvider>
    </AuthProvider>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, Component: Login },
      { 
        path: "destination-selection", 
        element: (
          <ProtectedRoute allowedRoles={["cashier"]}>
            <TableSelection />
          </ProtectedRoute>
        ),
      },
      { 
        path: "pos", 
        element: (
          <ProtectedRoute allowedRoles={["cashier"]}>
            <Pos />
          </ProtectedRoute>
        ),
      },
      {
        path: "admin",
        element: (
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        ),
        children: [
          { path: "dashboard", Component: AdminDashboard },
          { path: "catalog", Component: CatalogManagement },
          { path: "menu", Component: MenuManagement },
          { path: "orders", Component: Orders },
          { path: "branches", Component: BranchMonitoring },
          { path: "users", Component: UserManagement },
        ]
      }
    ],
  },
]);
