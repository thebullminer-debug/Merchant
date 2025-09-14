import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import Home from "@/pages/home";
import { MarketsPage } from "@/pages/markets";
import { AnalyticsPage } from "@/pages/analytics";
import { WatchlistPage } from "@/pages/watchlist";
import Portfolio from "@/pages/portfolio";
import SourcesPage from "@/pages/sources";
import ItemDetail from "@/pages/item-detail";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/markets" component={MarketsPage} />
      <Route path="/analytics" component={AnalyticsPage} />
      <Route path="/watchlist" component={WatchlistPage} />
      <Route path="/portfolio" component={Portfolio} />
      <Route path="/sources" component={SourcesPage} />
      <Route path="/collectibles/:id" component={ItemDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
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
