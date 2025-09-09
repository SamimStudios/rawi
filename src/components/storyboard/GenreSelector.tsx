import React from 'react';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useLanguage } from '@/contexts/LanguageContext';
import { GENRE_OPTIONS, MAX_GENRES } from '@/lib/storyboard-constants';
import { cn } from '@/lib/utils';

interface GenreSelectorProps {
  selectedGenres: string[];
  onGenreToggle: (genre: string) => void;
  disabled?: boolean;
}

export function GenreSelector({
  selectedGenres,
  onGenreToggle,
  disabled = false
}: GenreSelectorProps) {
  const { t } = useLanguage();

  const isGenreSelected = (genreValue: string) => selectedGenres.includes(genreValue);
  const canSelectMore = selectedGenres.length < MAX_GENRES;

  return (
    <div className="space-y-3">
      <Label>{t('genres')} * ({selectedGenres.length}/{MAX_GENRES})</Label>
      <div className="flex flex-wrap gap-2">
        {GENRE_OPTIONS.map(genre => {
          const isSelected = isGenreSelected(genre.value);
          const canSelect = canSelectMore || isSelected;
          
          return (
            <Badge
              key={genre.value}
              variant={isSelected ? "default" : "outline"}
              className={cn(
                "cursor-pointer transition-colors",
                canSelect ? "hover:bg-primary hover:text-primary-foreground" : "opacity-50 cursor-not-allowed",
                disabled && "opacity-50 cursor-not-allowed"
              )}
              onClick={() => {
                if (!disabled && canSelect) {
                  onGenreToggle(genre.value);
                }
              }}
            >
              {t(genre.key)}
            </Badge>
          );
        })}
      </div>
      <p className="text-sm text-muted-foreground">
        {t('selectUpToThreeGenres')}
      </p>
    </div>
  );
}