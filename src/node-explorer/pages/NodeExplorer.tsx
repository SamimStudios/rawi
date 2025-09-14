import React, { useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, RefreshCw, Settings } from 'lucide-react';
import { NodeHeader } from '../components/NodeHeader';
import { NodeSidebar } from '../components/NodeSidebar';
import { NodeContent } from '../components/NodeContent';
import { LanguageToggle } from '../components/LanguageToggle';
import { useNodeData } from '../hooks/useNodeData';
import { useLanguage } from '@/contexts/LanguageContext';
import { t, getTextDirection } from '../utils/i18n';
import { isValidUUID } from '../utils/nodeHelpers';

export function NodeExplorer() {
  const { id } = useParams<{ id: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { language } = useLanguage();
  
  // Query options state
  const [includeDescendants, setIncludeDescendants] = useState(searchParams.get('descendants') === '1');
  const [maxDepth, setMaxDepth] = useState(searchParams.get('depth') || '2');
  const [filterTypes, setFilterTypes] = useState<string[]>(
    searchParams.get('types')?.split(',').filter(Boolean) || []
  );
  const [showOptions, setShowOptions] = useState(false);

  const textDirection = getTextDirection(language);

  // Validate node ID
  if (!id || !isValidUUID(id)) {
    return (
      <div className="min-h-screen bg-background" dir={textDirection}>
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center">
                <AlertCircle className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">Invalid Node ID</h1>
                <p className="text-muted-foreground">
                  The provided node ID is not valid. Please check the URL and try again.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Fetch node data
  const { data, loading, error, refetch } = useNodeData(id, {
    ancestors: true,
    children: true,
    descendants: includeDescendants,
    depth: includeDescendants && maxDepth ? parseInt(maxDepth) : undefined,
    types: filterTypes.length > 0 ? filterTypes : undefined,
    normalizedForms: true
  });

  // Update URL when options change
  const updateSearchParams = () => {
    const params = new URLSearchParams();
    if (includeDescendants) params.set('descendants', '1');
    if (maxDepth && includeDescendants) params.set('depth', maxDepth);
    if (filterTypes.length > 0) params.set('types', filterTypes.join(','));
    setSearchParams(params);
  };

  React.useEffect(() => {
    updateSearchParams();
  }, [includeDescendants, maxDepth, filterTypes]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background" dir={textDirection}>
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center">
                <RefreshCw className="h-16 w-16 text-muted-foreground mx-auto mb-4 animate-spin" />
                <h1 className="text-2xl font-bold mb-2">{t('loading', language)}</h1>
                <p className="text-muted-foreground">
                  Fetching node data...
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="min-h-screen bg-background" dir={textDirection}>
        <div className="container mx-auto py-8">
          <Card>
            <CardContent className="flex items-center justify-center py-16">
              <div className="text-center">
                <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                <h1 className="text-2xl font-bold mb-2">{t('error', language)}</h1>
                <p className="text-muted-foreground mb-4">
                  {error || t('notFound', language)}
                </p>
                <Button onClick={() => refetch()} variant="outline">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const { node, ancestors, children, descendants } = data;

  return (
    <div className="min-h-screen bg-background" dir={textDirection}>
      {/* Header */}
      <NodeHeader node={node} ancestors={ancestors} />

      {/* Controls Bar */}
      <div className="border-b border-border bg-muted/30">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowOptions(!showOptions)}
                className="flex items-center gap-2"
              >
                <Settings className="h-4 w-4" />
                Options
              </Button>
              
              {data.descendants && (
                <Badge variant="outline" className="text-xs">
                  {data.descendants.length} {t('descendants', language)}
                </Badge>
              )}
              
              {data.children && (
                <Badge variant="outline" className="text-xs">
                  {data.children.length} {t('children', language)}
                </Badge>
              )}
            </div>

            <LanguageToggle />
          </div>

          {/* Options Panel */}
          {showOptions && (
            <div className="mt-4 p-4 bg-background border border-border rounded-md">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Include Descendants */}
                <div className="flex items-center space-x-2">
                  <Switch
                    id="descendants"
                    checked={includeDescendants}
                    onCheckedChange={setIncludeDescendants}
                  />
                  <Label htmlFor="descendants">{t('includeDescendants', language)}</Label>
                </div>

                {/* Max Depth */}
                {includeDescendants && (
                  <div className="flex items-center space-x-2">
                    <Label htmlFor="depth" className="whitespace-nowrap">
                      {t('maxDepth', language)}:
                    </Label>
                    <Input
                      id="depth"
                      type="number"
                      min="1"
                      max="10"
                      value={maxDepth}
                      onChange={(e) => setMaxDepth(e.target.value)}
                      className="w-20"
                    />
                  </div>
                )}

                {/* Filter Types */}
                <div className="flex items-center space-x-2">
                  <Label className="whitespace-nowrap">{t('filterByTypes', language)}:</Label>
                  <div className="flex gap-2">
                    {['group', 'form', 'media'].map((type) => (
                      <div key={type} className="flex items-center space-x-1">
                        <Checkbox
                          id={type}
                          checked={filterTypes.includes(type)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setFilterTypes([...filterTypes, type]);
                            } else {
                              setFilterTypes(filterTypes.filter(t => t !== type));
                            }
                          }}
                        />
                        <Label htmlFor={type} className="text-sm">
                          {t(type, language)}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex min-h-0 flex-1">
        {/* Main Panel */}
        <div className="flex-1 overflow-auto">
          <div className="container mx-auto p-4">
            <NodeContent node={node} children={children} />
            
            {/* Descendants */}
            {descendants && descendants.length > 0 && (
              <div className="mt-8">
                <Card>
                  <CardContent className="p-4">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      {t('descendants', language)}
                      <Badge variant="outline">{descendants.length}</Badge>
                    </h3>
                    <div className="space-y-2 max-h-64 overflow-auto">
                      {descendants.map((descendant) => (
                        <div
                          key={descendant.id}
                          className="flex items-center justify-between p-2 rounded border border-border hover:bg-muted/50"
                        >
                          <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Badge className="text-xs">
                              {t(descendant.node_type, language)}
                            </Badge>
                            <span className="font-mono text-sm truncate">
                              {descendant.path}
                            </span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            asChild
                          >
                            <a href={`/nodes/${descendant.id}`}>
                              View
                            </a>
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <NodeSidebar node={node} />
      </div>
    </div>
  );
}