import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { useGuestSession } from '@/hooks/useGuestSession';
import { useLanguage } from '@/contexts/LanguageContext';
import { MAX_FILE_SIZE, MAX_GENRES, MAX_SUPPORTING_CHARACTERS } from '@/lib/storyboard-constants';
import type { StoryboardFormData, SupportingCharacter } from '@/types/storyboard';

interface UseStoryboardFormProps {
  initialData?: any; // Job user_input data for edit mode
}

export function useStoryboardForm(props?: UseStoryboardFormProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const { sessionId } = useGuestSession();

  // Map database format to form format for edit mode
  const mapJobDataToForm = useCallback((jobUserInput: any): StoryboardFormData => {
    if (!jobUserInput) {
      return {
        template: '',
        leadName: user?.user_metadata?.full_name || '',
        leadGender: '',
        language: 'English',
        accent: 'US',
        size: '',
        prompt: ''
      };
    }

    return {
      template: jobUserInput.template || '',
      leadName: jobUserInput.characters?.lead?.name || jobUserInput.leadName || user?.user_metadata?.full_name || '',
      leadGender: jobUserInput.characters?.lead?.gender || jobUserInput.leadGender || '',
      language: jobUserInput.language || 'English',
      accent: jobUserInput.accent || 'US',
      size: jobUserInput.size || '',
      prompt: jobUserInput.prompt || ''
    };
  }, [user?.user_metadata?.full_name]);

  const [formData, setFormData] = useState<StoryboardFormData>(() => 
    mapJobDataToForm(props?.initialData)
  );

  const [selectedGenres, setSelectedGenres] = useState<string[]>(() => {
    // Initialize genres from job data in edit mode
    if (props?.initialData?.genres) {
      return Array.isArray(props.initialData.genres) ? props.initialData.genres : [];
    }
    return [];
  });
  
  const [faceImageUrl, setFaceImageUrl] = useState<string | null>(() => {
    // Initialize face image from job data in edit mode
    return props?.initialData?.characters?.lead?.faceImageUrl || 
           props?.initialData?.faceImageUrl || null;
  });
  
  const [isUploadingFaceImage, setIsUploadingFaceImage] = useState(false);
  
  const [supportingCharacters, setSupportingCharacters] = useState<SupportingCharacter[]>(() => {
    // Initialize supporting characters from job data in edit mode
    if (props?.initialData?.characters?.supporting && Array.isArray(props.initialData.characters.supporting)) {
      return props.initialData.characters.supporting.map((char: any, index: number) => ({
        id: char.id || `supporting-${index}`,
        name: char.name || '',
        gender: char.gender || '',
        faceImageUrl: char.faceImageUrl,
        isUploading: false
      }));
    }
    return [];
  });

  const handleInputChange = useCallback((field: keyof StoryboardFormData, value: string | boolean) => {
    setFormData(prev => {
      const newData = { ...prev, [field]: value };
      
      // Handle language change - reset accent to appropriate default
      if (field === 'language') {
        if (value === 'Arabic') {
          newData.accent = 'MSA'; // Default to MSA for Arabic
        } else if (value === 'English') {
          newData.accent = 'US'; // Default to US for English
        } else {
          newData.accent = '';
        }
      }
      
      return newData;
    });
  }, []);

  const handleGenreToggle = useCallback((genreValue: string) => {
    setSelectedGenres(prev => {
      if (prev.includes(genreValue)) {
        return prev.filter(g => g !== genreValue);
      } else if (prev.length < MAX_GENRES) {
        return [...prev, genreValue];
      }
      return prev; // Don't add if already at max
    });
  }, []);

  const uploadImageToStorage = useCallback(async (file: File): Promise<string> => {
    const fileExtension = file.type.split('/')[1] || 'jpg';
    const fileName = `face_ref_${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExtension}`;
    
    // Create folder structure based on user/session
    const folder = user?.id ? `users/${user.id}/face-refs` : `guests/${sessionId}/face-refs`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase.storage
      .from('ai-scenes-uploads')
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false
      });

    if (error) {
      throw new Error(error.message);
    }

    // Get public URL
    const { data: urlData } = supabase.storage
      .from('ai-scenes-uploads')
      .getPublicUrl(filePath);

    return urlData.publicUrl;
  }, [user?.id, sessionId]);

  const handleImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: t('fileTooLarge'),
        description: t('imageUnder5MB'),
        variant: "destructive"
      });
      return;
    }

    setIsUploadingFaceImage(true);
    
    try {
      const imageUrl = await uploadImageToStorage(file);
      setFaceImageUrl(imageUrl);
      
      toast({
        title: t('imageUploaded'),
        description: t('imageUploadedSuccessfully')
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: t('error'),
        description: t('imageUploadFailed'),
        variant: "destructive"
      });
    } finally {
      setIsUploadingFaceImage(false);
    }
  }, [uploadImageToStorage, toast, t]);

  const handleSupportingCharacterImageUpload = useCallback(async (characterId: string, file: File) => {
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: t('fileTooLarge'),
        description: t('imageUnder5MB'),
        variant: "destructive"
      });
      return;
    }

    // Set uploading state
    setSupportingCharacters(prev => prev.map(char => 
      char.id === characterId ? { ...char, isUploading: true } : char
    ));

    try {
      const imageUrl = await uploadImageToStorage(file);
      
      // Update character with image URL
      setSupportingCharacters(prev => prev.map(char => 
        char.id === characterId 
          ? { ...char, faceImageUrl: imageUrl, isUploading: false }
          : char
      ));

      toast({
        title: t('imageUploaded'),
        description: t('imageUploadedSuccessfully')
      });
    } catch (error) {
      console.error('Error uploading supporting character image:', error);
      setSupportingCharacters(prev => prev.map(char => 
        char.id === characterId ? { ...char, isUploading: false } : char
      ));
      
      toast({
        title: t('error'),
        description: t('imageUploadFailed'),
        variant: "destructive"
      });
    }
  }, [uploadImageToStorage, toast, t]);

  const removeImage = useCallback(() => {
    setFaceImageUrl(null);
  }, []);

  const validateForm = useCallback((): string | null => {
    if (!formData.leadName || !formData.leadGender || !formData.language || !formData.accent || !formData.template || !formData.size) {
      return t('fillAllRequired');
    }

    if (selectedGenres.length === 0) {
      return t('selectAtLeastOneGenre');
    }

    // Check supporting characters don't exceed limit
    if (supportingCharacters.length > MAX_SUPPORTING_CHARACTERS) {
      return t('tooManySupportingCharacters');
    }

    // Check supporting characters have required fields if they exist
    for (const character of supportingCharacters) {
      if (!character.name || !character.gender) {
        return t('supportingCharacterMustHaveNameAndGender');
      }
    }

    return null;
  }, [formData, selectedGenres, supportingCharacters, t]);

  // Reset form to initial state
  const resetForm = useCallback(() => {
    setFormData({
      template: '',
      leadName: user?.user_metadata?.full_name || '',
      leadGender: '',
      language: 'English',
      accent: 'US',
      size: '',
      prompt: ''
    });
    setSelectedGenres([]);
    setFaceImageUrl(null);
    setSupportingCharacters([]);
  }, [user?.user_metadata?.full_name]);

  // Function to convert form data back to database format
  const convertToJobFormat = useCallback(() => {
    return {
      template: formData.template,
      language: formData.language,
      accent: formData.accent,
      size: formData.size,
      prompt: formData.prompt,
      genres: selectedGenres,
      characters: {
        lead: {
          name: formData.leadName,
          gender: formData.leadGender,
          faceImageUrl: faceImageUrl
        },
        supporting: supportingCharacters
          .filter(char => char.name && char.gender)
          .map(char => ({
            id: char.id,
            name: char.name,
            gender: char.gender,
            faceImageUrl: char.faceImageUrl
          }))
      }
    };
  }, [formData, selectedGenres, faceImageUrl, supportingCharacters]);

  return {
    // Form state
    formData,
    selectedGenres,
    faceImageUrl,
    isUploadingFaceImage,
    supportingCharacters,
    
    // Form handlers
    handleInputChange,
    handleGenreToggle,
    handleImageUpload,
    handleSupportingCharacterImageUpload,
    removeImage,
    setSupportingCharacters,
    
    // Validation & utilities
    validateForm,
    resetForm,
    convertToJobFormat
  };
}