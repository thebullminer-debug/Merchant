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
        {/* Beautiful Flowing Gold Wave Background */}
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: `
              radial-gradient(ellipse 800px 150px at 25% 40%, rgba(255, 215, 0, 0.25) 0%, rgba(218, 165, 32, 0.15) 60%, transparent 100%),
              radial-gradient(ellipse 1000px 200px at 75% 60%, rgba(184, 134, 11, 0.2) 0%, rgba(255, 215, 0, 0.12) 60%, transparent 100%),
              radial-gradient(ellipse 600px 120px at 60% 20%, rgba(218, 165, 32, 0.18) 0%, rgba(184, 134, 11, 0.08) 60%, transparent 100%),
              radial-gradient(ellipse 700px 140px at 30% 80%, rgba(255, 215, 0, 0.15) 0%, rgba(218, 165, 32, 0.1) 60%, transparent 100%),
              radial-gradient(ellipse 400px 80px at 10% 50%, rgba(184, 134, 11, 0.12) 0%, transparent 70%),
              radial-gradient(ellipse 500px 100px at 90% 40%, rgba(255, 215, 0, 0.1) 0%, transparent 70%)
            `,
            backgroundSize: '100% 100%',
            pointerEvents: 'none',
            zIndex: 0
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
