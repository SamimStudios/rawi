import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { AlertTriangle, Zap, RefreshCw } from 'lucide-react';
import { Node } from '../types/node';
import { useLanguage } from '@/contexts/LanguageContext';
import { t, getTextDirection } from '../utils/i18n';

interface NodeSidebarProps {
  node: Node;
}

export function NodeSidebar({ node }: NodeSidebarProps) {
  const { language } = useLanguage();
  const textDirection = getTextDirection(language);

  const dependencies = Array.isArray(node.dependencies) ? node.dependencies : [];
  const hasGenerate = node.actions && typeof node.actions === 'object' && 'generate' in node.actions;
  const hasValidate = node.actions && typeof node.actions === 'object' && node.edit && typeof node.edit === 'object' && 'validate' in node.edit;

  return (
    <div className="w-80 border-l border-border bg-background/50" dir={textDirection}>
      <div className="p-4 space-y-4">
        {/* Dependencies */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              {t('dependencies', language)}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {dependencies.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                {t('noDependencies', language)}
              </p>
            ) : (
              <div className="space-y-2">
                {dependencies.map((dep, index) => (
                  <div
                    key={index}
                    className="p-2 rounded-md bg-muted/50 text-sm font-mono"
                  >
                    {typeof dep === 'string' ? dep : JSON.stringify(dep)}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4" />
              {t('actions', language)}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {!hasGenerate && !hasValidate ? (
              <p className="text-sm text-muted-foreground">
                {t('noActions', language)}
              </p>
            ) : (
              <>
                {hasGenerate && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    disabled
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Generate
                  </Button>
                )}
                {hasValidate && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="w-full justify-start"
                    disabled
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Validate
                  </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>

        {/* Node Metadata */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">
              Metadata
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="grid grid-cols-2 gap-2 text-sm">
              <span className="text-muted-foreground">ID:</span>
              <span className="font-mono text-xs break-all">{node.id}</span>
              
              <span className="text-muted-foreground">Job ID:</span>
              <span className="font-mono text-xs break-all">{node.job_id}</span>
              
              {node.parent_id && (
                <>
                  <span className="text-muted-foreground">Parent:</span>
                  <span className="font-mono text-xs break-all">{node.parent_id}</span>
                </>
              )}
              
              <span className="text-muted-foreground">Removable:</span>
              <Badge variant={node.removable !== false ? "default" : "secondary"} className="text-xs">
                {node.removable !== false ? "Yes" : "No"}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}