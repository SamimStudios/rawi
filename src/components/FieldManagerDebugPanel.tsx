import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown, RefreshCw, Zap, Database } from 'lucide-react';

interface DebugStats {
  batchStats: {
    resolveQueue: number;
    setQueue: number;
  };
  cacheStats: {
    total: number;
    valid: number;
    expired: number;
    loading: number;
    loadingFields: string[];
  };
}

interface FieldManagerDebugPanelProps {
  getBatchStats: () => any;
  getCacheStats: () => any;
  fieldRefs: string[];
  className?: string;
}

export default function FieldManagerDebugPanel({
  getBatchStats,
  getCacheStats,
  fieldRefs,
  className
}: FieldManagerDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState<DebugStats>({
    batchStats: { resolveQueue: 0, setQueue: 0 },
    cacheStats: { total: 0, valid: 0, expired: 0, loading: 0, loadingFields: [] }
  });
  
  const updateStats = () => {
    try {
      setStats({
        batchStats: getBatchStats(),
        cacheStats: getCacheStats()
      });
    } catch (error) {
      console.error('Failed to get debug stats:', error);
    }
  };
  
  useEffect(() => {
    if (isOpen) {
      updateStats();
      const interval = setInterval(updateStats, 1000);
      return () => clearInterval(interval);
    }
  }, [isOpen]);
  
  const { batchStats, cacheStats } = stats;
  
  return (
    <Card className={className}>
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <CollapsibleTrigger asChild>
          <CardHeader className="pb-3 cursor-pointer hover:bg-muted/50">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-mono">Field Manager Debug</CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs">
                  {fieldRefs.length} fields
                </Badge>
                {(batchStats.resolveQueue > 0 || batchStats.setQueue > 0) && (
                  <Badge variant="secondary" className="text-xs">
                    <Zap className="w-3 h-3 mr-1" />
                    Active
                  </Badge>
                )}
                <ChevronDown className="h-4 w-4" />
              </div>
            </div>
          </CardHeader>
        </CollapsibleTrigger>
        
        <CollapsibleContent>
          <CardContent className="pt-0 space-y-4">
            {/* Batch Queue Stats */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Zap className="w-4 h-4" />
                Batch Queues
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span>Resolve Queue:</span>
                  <Badge variant={batchStats.resolveQueue > 0 ? "default" : "outline"}>
                    {batchStats.resolveQueue}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span>Set Queue:</span>
                  <Badge variant={batchStats.setQueue > 0 ? "default" : "outline"}>
                    {batchStats.setQueue}
                  </Badge>
                </div>
              </div>
            </div>
            
            {/* Cache Stats */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold flex items-center gap-2">
                <Database className="w-4 h-4" />
                Field Registry Cache
              </h4>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                <div className="flex justify-between">
                  <span>Total:</span>
                  <Badge variant="outline">{cacheStats.total}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Valid:</span>
                  <Badge variant="default">{cacheStats.valid}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Expired:</span>
                  <Badge variant="secondary">{cacheStats.expired}</Badge>
                </div>
                <div className="flex justify-between">
                  <span>Loading:</span>
                  <Badge variant={cacheStats.loading > 0 ? "default" : "outline"}>
                    {cacheStats.loading}
                  </Badge>
                </div>
              </div>
              
              {cacheStats.loadingFields.length > 0 && (
                <div className="mt-2">
                  <span className="text-xs text-muted-foreground">Loading fields:</span>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {cacheStats.loadingFields.map(field => (
                      <Badge key={field} variant="outline" className="text-xs">
                        {field}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Field List */}
            <div className="space-y-2">
              <h4 className="text-sm font-semibold">Field References</h4>
              <div className="flex flex-wrap gap-1">
                {fieldRefs.map(ref => (
                  <Badge key={ref} variant="outline" className="text-xs font-mono">
                    {ref}
                  </Badge>
                ))}
              </div>
            </div>
            
            <Button
              size="sm"
              variant="outline"
              onClick={updateStats}
              className="w-full"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh Stats
            </Button>
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}