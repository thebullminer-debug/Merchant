import { ChartLine, Twitter, Facebook, Instagram, Linkedin } from "lucide-react";
import { Link } from "wouter";

export function Footer() {
  return (
    <footer className="bg-card border-t border-border mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Column */}
          <div>
            <div className="flex items-center space-x-2 mb-4">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <ChartLine className="text-primary-foreground text-sm" />
              </div>
              <span className="text-xl font-bold text-foreground">CollectiMarket</span>
            </div>
            <p className="text-muted-foreground mb-4">
              The leading platform for collectibles price tracking and market analysis.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="social-twitter">
                <Twitter size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="social-facebook">
                <Facebook size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="social-instagram">
                <Instagram size={20} />
              </a>
              <a href="#" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="social-linkedin">
                <Linkedin size={20} />
              </a>
            </div>
          </div>

          {/* Products Column */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Products</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/price-tracking" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-price-tracking">
                  Price Tracking
                </Link>
              </li>
              <li>
                <Link href="/market-analytics" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-market-analytics">
                  Market Analytics
                </Link>
              </li>
              <li>
                <Link href="/price-alerts" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-price-alerts">
                  Price Alerts
                </Link>
              </li>
              <li>
                <Link href="/portfolio" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-portfolio">
                  Portfolio Management
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources Column */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Resources</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/api" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-api">
                  API Documentation
                </Link>
              </li>
              <li>
                <Link href="/reports" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-reports">
                  Market Reports
                </Link>
              </li>
              <li>
                <Link href="/help" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-help">
                  Help Center
                </Link>
              </li>
              <li>
                <Link href="/community" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-community">
                  Community
                </Link>
              </li>
            </ul>
          </div>

          {/* Company Column */}
          <div>
            <h3 className="font-semibold text-foreground mb-4">Company</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/about" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-about">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/careers" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-careers">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-privacy">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="text-muted-foreground hover:text-foreground transition-colors" data-testid="footer-terms">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-8 pt-8 text-center">
          <p className="text-muted-foreground">
            &copy; 2024 CollectiMarket. All rights reserved. Data aggregated from multiple marketplace sources.
          </p>
        </div>
      </div>
    </footer>
  );
}
