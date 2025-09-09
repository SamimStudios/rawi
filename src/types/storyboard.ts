// TypeScript interfaces for storyboard form data

export interface StoryboardFormData {
  template: string;
  leadName: string;
  leadGender: string;
  leadAiCharacter: boolean;
  language: string;
  accent: string;
  size: string;
  prompt: string;
}

export interface SupportingCharacter {
  id: string;
  name: string;
  gender: string;
  aiFace: boolean;
  faceImageUrl?: string;
  faceImage?: File;
  faceImagePreview?: string;
  isUploading?: boolean;
}

export interface StoryboardTemplate {
  id: string;
  name: string;
  description: string;
}

export interface GenreOption {
  key: string;
  value: string;
}

export interface LanguageOption {
  key: string;
  value: string;
}

export interface AccentOption {
  key: string;
  value: string;
}