// Centralized constants for storyboard forms to ensure consistency across components

export const LANGUAGES = [
  { key: 'englishLang', value: 'English' }, 
  { key: 'arabicLang', value: 'Arabic' }
] as const;

export const ACCENTS = {
  'English': [
    { key: 'accentUS', value: 'US' },
    { key: 'accentUK', value: 'UK' }
  ],
  'Arabic': [
    { key: 'accentEgyptian', value: 'Egyptian' },
    { key: 'accentMSA', value: 'MSA' },
    { key: 'accentGulf', value: 'Gulf' },
    { key: 'accentLevantine', value: 'Levantine' }
  ]
} as const;

export const GENRE_OPTIONS = [
  { key: 'genreAction', value: 'Action' },
  { key: 'genreAdventure', value: 'Adventure' },
  { key: 'genreComedy', value: 'Comedy' },
  { key: 'genreDrama', value: 'Drama' },
  { key: 'genreFantasy', value: 'Fantasy' },
  { key: 'genreHorror', value: 'Horror' },
  { key: 'genreMystery', value: 'Mystery' },
  { key: 'genreRomance', value: 'Romance' },
  { key: 'genreSciFi', value: 'Sci-Fi' },
  { key: 'genreThriller', value: 'Thriller' },
  { key: 'genreDocumentary', value: 'Documentary' }
] as const;

export const MAX_SUPPORTING_CHARACTERS = 1;
export const MAX_GENRES = 3;
export const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB