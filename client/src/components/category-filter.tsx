import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Clock, CreditCard, Disc3, Grid3X3 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { Category } from "@shared/schema";

interface CategoryFilterProps {
  selectedCategory: string | null;
  onCategoryChange: (categoryId: string | null) => void;
}

const categoryIcons = {
  watches: Clock,
  "trading-cards": CreditCard,
  vinyl: Disc3,
};

export function CategoryFilter({ selectedCategory, onCategoryChange }: CategoryFilterProps) {
  const { data: categories = [] } = useQuery<Category[]>({
    queryKey: ["/api/categories"],
    staleTime: Infinity,
  });

  return (
    <section className="mb-8">
      <div className="flex flex-wrap gap-4 justify-center">
        <Button
          variant={selectedCategory === null ? "default" : "secondary"}
          className={`px-6 py-2 rounded-full font-medium transition-colors ${
            selectedCategory === null
              ? "bg-primary text-primary-foreground hover:bg-primary/90"
              : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
          }`}
          onClick={() => onCategoryChange(null)}
          data-testid="filter-all"
        >
          <Grid3X3 className="mr-2" size={16} />
          All Categories
        </Button>
        
        {categories.map((category) => {
          const IconComponent = categoryIcons[category.slug as keyof typeof categoryIcons] || Grid3X3;
          const isSelected = selectedCategory === category.id;
          
          return (
            <Button
              key={category.id}
              variant={isSelected ? "default" : "secondary"}
              className={`px-6 py-2 rounded-full font-medium transition-colors ${
                isSelected
                  ? "bg-primary text-primary-foreground hover:bg-primary/90"
                  : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
              }`}
              onClick={() => onCategoryChange(category.id)}
              data-testid={`filter-${category.slug}`}
            >
              <IconComponent className="mr-2" size={16} />
              {category.name}
            </Button>
          );
        })}
      </div>
    </section>
  );
}
