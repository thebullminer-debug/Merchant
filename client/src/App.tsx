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
        {/* TEST: Very Visible Fixed Element */}
        <div 
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            width: '300px',
            height: '100px',
            backgroundColor: '#FFD700',
            color: '#000',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: 'bold',
            zIndex: 9999,
            border: '3px solid #B8860B'
          }}
        >
          FIXED GOLD ELEMENT TEST
        </div>
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
