import { createFileRoute, Navigate } from "@tanstack/react-router";
// import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import apiClient from "@/api/client";
import { RoleBasedLayout } from "@/components/RoleBasedLayout";
import type { User } from "@/types";

export const Route = createFileRoute("/")({
  component: HomePage,
});

function HomePage() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ALL HOOKS MUST BE AT THE TOP LEVEL - before any conditional returns
  // const { isLoading: isUserLoading, error } = useQuery({
  //   queryKey: ['currentUser'],
  //   queryFn: () => {
  //     console.warn('Verifying user with API URL:', import.meta.env.VITE_API_URL)
  //     return apiClient.getCurrentUser()
  //   },
  //   retry: 1,
  //   enabled: false // Temporarily disable server verification
  // })

  // // Handle errors separately
  // if (error) {
  //   console.error('getCurrentUser failed:', error)
  //   apiClient.clearAuth()
  //   window.location.href = '/site'
  // }

  useEffect(() => {
    const storedUser = localStorage.getItem("pos_user");

    if (storedUser) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } catch (error) {
        console.error("Failed to parse stored user:", error);
        localStorage.removeItem("pos_user");
        localStorage.removeItem("pos_token");
      }
    }
    setIsLoading(false);
  }, []);

  // Show loading while we check localStorage
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading POS System...</p>
        </div>
      </div>
    );
  }

  // Redirect to public website by default (no authentication required)
  console.log(
    "Checking auth - isAuthenticated:",
    apiClient.isAuthenticated(),
    "user:",
    user,
  );
  if (!apiClient.isAuthenticated() || !user) {
    console.log("Not authenticated, redirecting to public website");
    return <Navigate to="/site" />;
  }

  // Redirect admin users to admin panel
  if (user.role === "admin") {
    console.log("Admin user detected, redirecting to admin panel");
    return <Navigate to="/admin/dashboard" />;
  }

  console.log(
    "User authenticated, rendering role-based layout for user:",
    user,
  );
  return <RoleBasedLayout user={user} />;
}
