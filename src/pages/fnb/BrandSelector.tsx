import { useNavigate } from 'react-router-dom';
import { Plus, Store, Settings, MoreVertical, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useFnbBrands } from '@/hooks/useFnbBrands';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { toast } from 'sonner';

export default function BrandSelector() {
  const { t, isRTL } = useLanguage();
  const navigate = useNavigate();
  const { brands, isLoading, deleteBrand } = useFnbBrands();
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteBrand.mutateAsync(deleteId);
      toast.success(t('fnb.brandDeleted'));
    } catch (error) {
      toast.error(t('error'));
    }
    setDeleteId(null);
  };

  const getBrandTypeLabel = (type: string) => {
    return t(`fnb.brandType.${type}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-6 w-32" />
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-2 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">{t('fnb.myBrands')}</h1>
          <p className="text-muted-foreground mt-1">{t('fnb.selectOrCreateBrand')}</p>
        </div>
        <Button onClick={() => navigate('/app/fnb/new')} size="lg">
          <Plus className="h-5 w-5 me-2" />
          {t('fnb.createBrand')}
        </Button>
      </div>

      {/* Brands Grid */}
      {brands.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16">
            <Store className="h-16 w-16 text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">{t('fnb.noBrandsYet')}</h3>
            <p className="text-muted-foreground text-center mb-6 max-w-md">
              {t('fnb.noBrandsDescription')}
            </p>
            <Button onClick={() => navigate('/app/fnb/new')} size="lg">
              <Plus className="h-5 w-5 me-2" />
              {t('fnb.createFirstBrand')}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <Card 
              key={brand.id} 
              className="hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => navigate(`/app/fnb/${brand.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {brand.visual_identity?.logo_primary ? (
                      <img 
                        src={brand.visual_identity.logo_primary} 
                        alt={brand.brand_name}
                        className="h-12 w-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div 
                        className="h-12 w-12 rounded-lg flex items-center justify-center text-xl font-bold text-white"
                        style={{ 
                          backgroundColor: brand.visual_identity?.primary_color_hex || '#6366f1' 
                        }}
                      >
                        {brand.brand_name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <CardTitle className="text-lg">{brand.brand_name}</CardTitle>
                      <CardDescription>{getBrandTypeLabel(brand.brand_type)}</CardDescription>
                    </div>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align={isRTL ? 'start' : 'end'}>
                      <DropdownMenuItem onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/app/fnb/${brand.id}/setup`);
                      }}>
                        <Settings className="h-4 w-4 me-2" />
                        {t('fnb.editBrand')}
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        className="text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteId(brand.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 me-2" />
                        {t('delete')}
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {brand.brand_short_bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {brand.brand_short_bio}
                    </p>
                  )}
                  <div>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-muted-foreground">{t('fnb.setupProgress')}</span>
                      <span className="font-medium">{brand.setup_progress}%</span>
                    </div>
                    <Progress value={brand.setup_progress} className="h-2" />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{brand.city || brand.country}</span>
                    <span>•</span>
                    <span>{t(`fnb.priceLevel.${brand.price_level}`)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add New Brand Card */}
          <Card 
            className="border-dashed hover:border-primary/50 hover:bg-muted/50 transition-colors cursor-pointer"
            onClick={() => navigate('/app/fnb/new')}
          >
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[200px]">
              <Plus className="h-10 w-10 text-muted-foreground mb-2" />
              <span className="text-muted-foreground font-medium">{t('fnb.addNewBrand')}</span>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('fnb.deleteBrandTitle')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('fnb.deleteBrandDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel')}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground">
              {t('delete')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
