import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { createRouter, RouterProvider } from "@tanstack/react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { OfflineIndicator } from "@/components/OfflineIndicator";
import { ThemeProvider } from "@/components/theme-provider";
import { queryClient } from "@/lib/queryClient";
import * as Sentry from "@sentry/react";
import "./i18n"; // Import i18n configuration
import "./index.css";

// Initialize Sentry error tracking (optional)
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  Sentry.init({
    dsn: sentryDsn,
    environment: import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration({
        maskAllText: true,
        blockAllMedia: true,
      }),
    ],
    // Performance Monitoring
    tracesSampleRate:
      import.meta.env.VITE_ENVIRONMENT === "production" ? 0.1 : 1.0,
    // Session Replay
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    // Filter out sensitive data
    beforeSend(event) {
      // Remove sensitive data from breadcrumbs
      if (event.breadcrumbs) {
        event.breadcrumbs = event.breadcrumbs.map((breadcrumb) => {
          if (
            breadcrumb.category === "fetch" ||
            breadcrumb.category === "xhr"
          ) {
            // Mask Authorization headers
            if (breadcrumb.data?.["request.headers"]) {
              const headers = breadcrumb.data["request.headers"];
              if (headers.Authorization) {
                headers.Authorization = "***MASKED***";
              }
            }
          }
          return breadcrumb;
        });
      }
      return event;
    },
  });
  console.warn(
    "Sentry initialized for environment:",
    import.meta.env.VITE_ENVIRONMENT || import.meta.env.MODE,
  );
} else {
  console.warn("Sentry DSN not configured, error tracking disabled");
}

// Import the generated route tree
import { routeTree } from "./routeTree.gen";

// Create a new router instance
const router = createRouter({ routeTree });

// Register the router instance for type safety
declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}

// Render the app
const rootElement = document.getElementById("root")!;
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <StrictMode>
      <ErrorBoundary>
        <ThemeProvider defaultTheme="system" storageKey="pos-theme">
          <QueryClientProvider client={queryClient}>
            <OfflineIndicator />
            <RouterProvider router={router} />
            <Toaster />
          </QueryClientProvider>
        </ThemeProvider>
      </ErrorBoundary>
    </StrictMode>,
  );
}
