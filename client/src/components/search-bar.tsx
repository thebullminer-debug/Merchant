import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useLocation } from "wouter";
import type { Collectible } from "@shared/schema";

export function SearchBar() {
  const [searchQuery, setSearchQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [, setLocation] = useLocation();

  const { data: searchResults = [], isLoading } = useQuery<Collectible[]>({
    queryKey: ["/api/collectibles/search", searchQuery],
    queryFn: async () => {
      if (!searchQuery.trim()) return [];
      const response = await fetch(`/api/collectibles/search?q=${encodeURIComponent(searchQuery)}`);
      if (!response.ok) throw new Error("Search failed");
      return response.json();
    },
    enabled: searchQuery.length > 2,
    staleTime: 300000, // 5 minutes
  });

  useEffect(() => {
    if (searchQuery.length > 2) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  }, [searchQuery]);

  const handleSelectItem = (collectible: Collectible) => {
    setSearchQuery("");
    setIsOpen(false);
    setLocation(`/item/${collectible.id}`);
  };

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setIsOpen(false);
      setLocation(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <div className="relative w-full">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="text-muted-foreground" size={16} />
          </div>
          <Input
            type="text"
            placeholder="Search for collectible items..."
            className="search-focus w-full pl-10 pr-4 py-2 bg-input border border-border rounded-lg text-foreground placeholder-muted-foreground"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            data-testid="input-search"
          />
        </div>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0 bg-popover border border-border" align="start">
        {isLoading ? (
          <div className="p-4 text-center">
            <div className="loading-shimmer h-4 w-32 mx-auto rounded"></div>
          </div>
        ) : searchResults.length > 0 ? (
          <div className="max-h-80 overflow-y-auto">
            {searchResults.map((collectible) => (
              <button
                key={collectible.id}
                className="w-full p-3 text-left hover:bg-accent hover:text-accent-foreground transition-colors border-b border-border last:border-b-0"
                onClick={() => handleSelectItem(collectible)}
                data-testid={`search-result-${collectible.id}`}
              >
                <div className="flex items-start space-x-3">
                  {collectible.imageUrl && (
                    <img
                      src={collectible.imageUrl}
                      alt={collectible.name}
                      className="w-12 h-12 rounded object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-medium text-foreground">{collectible.name}</h4>
                    <p className="text-sm text-muted-foreground">
                      {collectible.brand && `${collectible.brand} • `}
                      {collectible.condition}
                    </p>
                  </div>
                </div>
              </button>
            ))}
            <div className="p-3 border-t border-border">
              <Button
                variant="ghost"
                className="w-full justify-start"
                onClick={handleSearch}
                data-testid="button-view-all-results"
              >
                <Search size={16} className="mr-2" />
                View all results for "{searchQuery}"
              </Button>
            </div>
          </div>
        ) : searchQuery.length > 2 ? (
          <div className="p-4 text-center text-muted-foreground">
            No results found for "{searchQuery}"
          </div>
        ) : null}
      </PopoverContent>
    </Popover>
  );
}
