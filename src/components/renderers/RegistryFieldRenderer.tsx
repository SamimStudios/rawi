import React, { useEffect, useState } from 'react';
import { useFields, FieldEntry } from '@/hooks/useFields';
import FieldRenderer from './FieldRenderer';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle } from 'lucide-react';

interface RegistryFieldRendererProps {
  fieldRef: string;
  value?: any;
  onChange: (value: any) => void;
  className?: string;
}

export default function RegistryFieldRenderer({
  fieldRef,
  value,
  onChange,
  className
}: RegistryFieldRendererProps) {
  const { getEntry } = useFields();
  const [field, setField] = useState<FieldEntry | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchField = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const fieldEntry = await getEntry(fieldRef);
        if (!fieldEntry) {
          setError(`Field not found in registry: ${fieldRef}`);
        } else {
          setField(fieldEntry);
        }
      } catch (err) {
        setError(`Failed to fetch field: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchField();
  }, [fieldRef, getEntry]);

  if (loading) {
    return (
      <div className="space-y-2">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-10 w-full" />
      </div>
    );
  }

  if (error || !field) {
    return (
      <div className="p-4 border border-dashed border-destructive/50 rounded-md">
        <p className="text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error || `Field not found: ${fieldRef}`}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Field ref: {fieldRef}
        </p>
      </div>
    );
  }

  return (
    <FieldRenderer
      field={field}
      value={value}
      onChange={onChange}
    />
  );
}