import { useState } from "react";
import { Link } from "wouter";
import { Search, ChartLine, Menu, X } from "lucide-react";
import { SearchBar } from "../search-bar";
import { Button } from "@/components/ui/button";

export function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <header className="bg-card border-b border-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo and Brand */}
          <div className="flex items-center space-x-4">
            <Link href="/" className="flex items-center space-x-2" data-testid="logo-link">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <ChartLine className="text-primary-foreground text-sm" />
              </div>
              <span className="text-xl font-bold text-foreground">Merchant</span>
            </Link>
          </div>

          {/* Search Bar - Desktop */}
          <div className="hidden md:flex flex-1 max-w-2xl mx-8">
            <SearchBar />
          </div>

          {/* Navigation Links - Desktop */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link href="/markets" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-markets">
              Markets
            </Link>
            <Link href="/watchlist" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-watchlist">
              Watchlist
            </Link>
            <Link href="/portfolio" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-portfolio">
              Portfolio
            </Link>
            <Link href="/analytics" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-analytics">
              Analytics
            </Link>
            <Button className="bg-primary hover:bg-primary/90 text-primary-foreground" data-testid="button-signin">
              Sign In
            </Button>
          </nav>

          {/* Mobile Menu Toggle */}
          <button
            className="md:hidden text-muted-foreground hover:text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            data-testid="button-mobile-menu"
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border py-4 space-y-4">
            <div className="px-2">
              <SearchBar />
            </div>
            <nav className="flex flex-col space-y-2">
              <Link href="/markets" className="px-2 py-2 text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-markets-mobile">
                Markets
              </Link>
              <Link href="/watchlist" className="px-2 py-2 text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-watchlist-mobile">
                Watchlist
              </Link>
              <Link href="/portfolio" className="px-2 py-2 text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-portfolio-mobile">
                Portfolio
              </Link>
              <Link href="/analytics" className="px-2 py-2 text-muted-foreground hover:text-foreground transition-colors" data-testid="nav-analytics-mobile">
                Analytics
              </Link>
              <div className="px-2 pt-2">
                <Button className="w-full bg-primary hover:bg-primary/90 text-primary-foreground" data-testid="button-signin-mobile">
                  Sign In
                </Button>
              </div>
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
