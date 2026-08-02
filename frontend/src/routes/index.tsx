import * as React from "react";
import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom";

import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { PublicOnlyRoute } from "@/routes/PublicOnlyRoute";
import { AdminRoute } from "@/routes/AdminRoute";
import { AppShell } from "@/components/layout/AppShell";

import { FullPageLoader } from "@/components/states/FullPageLoader";
import { ErrorBoundary } from "@/app/ErrorBoundary";

const LoginPage = React.lazy(() => import("@/features/auth/pages/LoginPage"));
const SignupPage = React.lazy(() => import("@/features/auth/pages/SignupPage"));
const DashboardPage = React.lazy(
  () => import("@/features/content/pages/DashboardPage")
);
const PublicSharePage = React.lazy(
  () => import("@/features/share/pages/PublicSharePage")
);
const AdminPage = React.lazy(() => import("@/features/admin/pages/AdminPage"));
const LandingPage = React.lazy(() => import("@/pages/LandingPage"));
const NotFoundPage = React.lazy(() => import("@/pages/NotFoundPage"));

const Suspense = ({ children }: { children: React.ReactNode }) => (
  <React.Suspense fallback={<FullPageLoader />}>{children}</React.Suspense>
);

const router = createBrowserRouter([
  {
    path: "/",
    element: (
      <Suspense>
        <LandingPage />
      </Suspense>
    ),
  },
  {
    path: "/login",
    element: (
      <PublicOnlyRoute>
        <Suspense>
          <LoginPage />
        </Suspense>
      </PublicOnlyRoute>
    ),
  },
  {
    path: "/signup",
    element: (
      <PublicOnlyRoute>
        <Suspense>
          <SignupPage />
        </Suspense>
      </PublicOnlyRoute>
    ),
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <ErrorBoundary>
          <AppShell />
        </ErrorBoundary>
      </ProtectedRoute>
    ),
    children: [
      {
        index: true,
        element: (
          <Suspense>
            <DashboardPage />
          </Suspense>
        ),
      },
      { path: "content", element: <Navigate to="/dashboard" replace /> },
    ],
  },
  {
    path: "/admin",
    element: (
      <AdminRoute>
        <ErrorBoundary>
          <Suspense>
            <AdminPage />
          </Suspense>
        </ErrorBoundary>
      </AdminRoute>
    ),
  },
  {
    path: "/share/:shareId",
    element: (
      <Suspense>
        <PublicSharePage />
      </Suspense>
    ),
  },
  {
    path: "*",
    element: (
      <Suspense>
        <NotFoundPage />
      </Suspense>
    ),
  },
]);

export function AppRouter() {
  return <RouterProvider router={router} />;
}
