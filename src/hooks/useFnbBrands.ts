import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { FnbBrand, FnbBranch, FnbMenuItem, FnbContentRequest, FnbGeneratedContent } from '@/types/fnb';
import type { Json } from '@/integrations/supabase/types';

// Brands CRUD
export function useFnbBrands() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const brandsQuery = useQuery({
    queryKey: ['fnb-brands', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data, error } = await supabase
        .from('fnb_brands')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });
      if (error) throw error;
      return data as unknown as FnbBrand[];
    },
    enabled: !!user?.id,
  });

  const createBrand = useMutation({
    mutationFn: async (brand: Partial<FnbBrand>) => {
      if (!user?.id) throw new Error('Not authenticated');
      
      const slug = brand.brand_name
        ?.toLowerCase()
        .replace(/[^a-z0-9\u0600-\u06FF]+/g, '-')
        .replace(/^-|-$/g, '') || 'brand';
      
      const { data, error } = await supabase
        .from('fnb_brands')
        .insert({
          brand_name: brand.brand_name || '',
          brand_slug: slug,
          user_id: user.id,
          brand_type: brand.brand_type || 'restaurant',
          country: brand.country || 'Saudi Arabia',
          city: brand.city,
          district: brand.district,
          default_language: brand.default_language || 'ar',
          brand_short_bio: brand.brand_short_bio,
          brand_long_bio: brand.brand_long_bio,
          price_level: brand.price_level || 'mid_range',
          visual_identity: (brand.visual_identity || {}) as Json,
          voice: (brand.voice || {}) as Json,
          preferences: (brand.preferences || {}) as Json,
          social_links: (brand.social_links || {}) as Json,
          account_owner: (brand.account_owner || {}) as Json,
          setup_progress: brand.setup_progress || 0,
        })
        .select()
        .single();
      if (error) throw error;
      return data as unknown as FnbBrand;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fnb-brands'] });
    },
  });

  const updateBrand = useMutation({
    mutationFn: async ({ id, ...updates }: Partial<FnbBrand> & { id: string }) => {
      const payload: Record<string, unknown> = {};
      if (updates.brand_name !== undefined) payload.brand_name = updates.brand_name;
      if (updates.brand_type !== undefined) payload.brand_type = updates.brand_type;
      if (updates.country !== undefined) payload.country = updates.country;
      if (updates.city !== undefined) payload.city = updates.city;
      if (updates.district !== undefined) payload.district = updates.district;
      if (updates.default_language !== undefined) payload.default_language = updates.default_language;
      if (updates.brand_short_bio !== undefined) payload.brand_short_bio = updates.brand_short_bio;
      if (updates.brand_long_bio !== undefined) payload.brand_long_bio = updates.brand_long_bio;
      if (updates.price_level !== undefined) payload.price_level = updates.price_level;
      if (updates.visual_identity !== undefined) payload.visual_identity = updates.visual_identity as Json;
      if (updates.voice !== undefined) payload.voice = updates.voice as Json;
      if (updates.preferences !== undefined) payload.preferences = updates.preferences as Json;
      if (updates.social_links !== undefined) payload.social_links = updates.social_links as Json;
      if (updates.account_owner !== undefined) payload.account_owner = updates.account_owner as Json;
      if (updates.setup_progress !== undefined) payload.setup_progress = updates.setup_progress;
      
      const { data, error } = await supabase
        .from('fnb_brands')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as FnbBrand;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fnb-brands'] });
    },
  });

  const deleteBrand = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('fnb_brands').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fnb-brands'] });
    },
  });

  return { brands: brandsQuery.data || [], isLoading: brandsQuery.isLoading, error: brandsQuery.error, createBrand, updateBrand, deleteBrand };
}

export function useFnbBrand(brandId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['fnb-brand', brandId],
    queryFn: async () => {
      if (!brandId) return null;
      const { data, error } = await supabase.from('fnb_brands').select('*').eq('id', brandId).single();
      if (error) throw error;
      return data as unknown as FnbBrand;
    },
    enabled: !!brandId && !!user?.id,
  });
}

export function useFnbBranches(brandId: string | undefined) {
  const queryClient = useQueryClient();
  const branchesQuery = useQuery({
    queryKey: ['fnb-branches', brandId],
    queryFn: async () => {
      if (!brandId) return [];
      const { data, error } = await supabase.from('fnb_branches').select('*').eq('brand_id', brandId).order('sort_order', { ascending: true });
      if (error) throw error;
      return data as unknown as FnbBranch[];
    },
    enabled: !!brandId,
  });

  const createBranch = useMutation({
    mutationFn: async (branch: Partial<FnbBranch>) => {
      const { data, error } = await supabase
        .from('fnb_branches')
        .insert({ brand_id: branch.brand_id!, branch_name: branch.branch_name || '', photos: (branch.photos || {}) as Json, branch_tags: branch.branch_tags || [] })
        .select().single();
      if (error) throw error;
      return data as unknown as FnbBranch;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['fnb-branches', brandId] }); },
  });

  return { branches: branchesQuery.data || [], isLoading: branchesQuery.isLoading, createBranch };
}

export function useFnbMenuItems(brandId: string | undefined) {
  const queryClient = useQueryClient();
  const menuItemsQuery = useQuery({
    queryKey: ['fnb-menu-items', brandId],
    queryFn: async () => {
      if (!brandId) return [];
      const { data, error } = await supabase.from('fnb_menu_items').select('*').eq('brand_id', brandId).order('sort_order', { ascending: true });
      if (error) throw error;
      return data as unknown as FnbMenuItem[];
    },
    enabled: !!brandId,
  });

  const createMenuItem = useMutation({
    mutationFn: async (item: Partial<FnbMenuItem>) => {
      const { data, error } = await supabase
        .from('fnb_menu_items')
        .insert({ brand_id: item.brand_id!, item_name_ar: item.item_name_ar || '', item_tags: item.item_tags || [], item_branches: item.item_branches || [] })
        .select().single();
      if (error) throw error;
      return data as unknown as FnbMenuItem;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['fnb-menu-items', brandId] }); },
  });

  return { menuItems: menuItemsQuery.data || [], isLoading: menuItemsQuery.isLoading, createMenuItem };
}

export function useFnbContentRequests(brandId: string | undefined) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const requestsQuery = useQuery({
    queryKey: ['fnb-content-requests', brandId],
    queryFn: async () => {
      if (!brandId) return [];
      const { data, error } = await supabase.from('fnb_content_requests').select('*').eq('brand_id', brandId).order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as FnbContentRequest[];
    },
    enabled: !!brandId,
  });

  const createRequest = useMutation({
    mutationFn: async (request: Partial<FnbContentRequest>) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('fnb_content_requests')
        .insert({ brand_id: request.brand_id!, user_id: user.id, content_type: request.content_type || 'image', prompt: request.prompt || '', options: (request.options || {}) as Json, status: 'pending', request_type: request.request_type || 'manual' })
        .select().single();
      if (error) throw error;
      return data as unknown as FnbContentRequest;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['fnb-content-requests', brandId] }); },
  });

  return { requests: requestsQuery.data || [], isLoading: requestsQuery.isLoading, createRequest, refetch: requestsQuery.refetch };
}

export function useFnbGeneratedContent(brandId: string | undefined) {
  const queryClient = useQueryClient();

  const contentQuery = useQuery({
    queryKey: ['fnb-generated-content', brandId],
    queryFn: async () => {
      if (!brandId) return [];
      const { data, error } = await supabase.from('fnb_generated_content').select('*').eq('brand_id', brandId).eq('is_archived', false).order('created_at', { ascending: false });
      if (error) throw error;
      return data as unknown as FnbGeneratedContent[];
    },
    enabled: !!brandId,
  });

  const toggleFavorite = useMutation({
    mutationFn: async ({ id, is_favorite }: { id: string; is_favorite: boolean }) => {
      const { data, error } = await supabase.from('fnb_generated_content').update({ is_favorite }).eq('id', id).select().single();
      if (error) throw error;
      return data as unknown as FnbGeneratedContent;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['fnb-generated-content', brandId] }); },
  });

  const archiveContent = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('fnb_generated_content').update({ is_archived: true }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['fnb-generated-content', brandId] }); },
  });

  return { content: contentQuery.data || [], isLoading: contentQuery.isLoading, toggleFavorite, archiveContent, refetch: contentQuery.refetch };
}
