import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import Home from "@/pages/home";
import { SearchPage } from "@/pages/search";
import { MarketsPage } from "@/pages/markets";
import { AnalyticsPage } from "@/pages/analytics";
import { WatchlistPage } from "@/pages/watchlist";
import ItemDetail from "@/pages/item-detail";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/search" component={SearchPage} />
      <Route path="/markets" component={MarketsPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/watchlist" component={WatchlistPage} />
      <Route path="/item/:id" component={ItemDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* Very Visible Gold Wave Background */}
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: `
              linear-gradient(45deg, rgba(255, 215, 0, 0.8) 0%, transparent 25%, rgba(218, 165, 32, 0.8) 50%, transparent 75%, rgba(184, 134, 11, 0.8) 100%),
              linear-gradient(135deg, rgba(184, 134, 11, 0.6) 0%, transparent 25%, rgba(255, 215, 0, 0.6) 50%, transparent 75%, rgba(218, 165, 32, 0.6) 100%)
            `,
            backgroundSize: '300px 300px, 400px 400px',
            pointerEvents: 'none',
            zIndex: 0,
            opacity: 0.3
          }}
        />
        <div className="min-h-screen bg-background text-foreground dark">
          <Header />
          <Router />
          <Footer />
          <Toaster />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
