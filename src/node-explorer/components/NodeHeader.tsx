import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { Node } from '../types/node';
import { useBreadcrumb } from '../hooks/useBreadcrumb';
import { getNodeTypeIcon, getNodeTypeColor, formatTimestamp } from '../utils/nodeHelpers';
import { useLanguage } from '@/contexts/LanguageContext';
import { t, getTextDirection } from '../utils/i18n';

interface NodeHeaderProps {
  node: Node;
  ancestors?: Node[];
}

export function NodeHeader({ node, ancestors = [] }: NodeHeaderProps) {
  const { language } = useLanguage();
  const breadcrumb = useBreadcrumb(node, ancestors);
  const textDirection = getTextDirection(language);

  return (
    <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto p-4" dir={textDirection}>
        {/* Breadcrumb */}
        {breadcrumb.length > 0 && (
          <Breadcrumb className="mb-4">
            <BreadcrumbList className={language === 'ar' ? 'flex-row-reverse' : ''}>
              {breadcrumb.map((item, index) => (
                <React.Fragment key={item.id}>
                  <BreadcrumbItem>
                    {index === breadcrumb.length - 1 ? (
                      <BreadcrumbPage className="flex items-center gap-2">
                        <span>{getNodeTypeIcon(item.node_type)}</span>
                        <span>{item.title}</span>
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink 
                        href={`/nodes/${item.id}`}
                        className="flex items-center gap-2 hover:text-primary"
                      >
                        <span>{getNodeTypeIcon(item.node_type)}</span>
                        <span>{item.title}</span>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                  {index < breadcrumb.length - 1 && <BreadcrumbSeparator />}
                </React.Fragment>
              ))}
            </BreadcrumbList>
          </Breadcrumb>
        )}

        {/* Main header info */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="text-2xl">
                {getNodeTypeIcon(node.node_type)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">
                  {node.path.split('.').pop() || 'Node'}
                </h1>
                <p className="text-sm text-muted-foreground font-mono">
                  {node.path}
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge className={getNodeTypeColor(node.node_type)}>
              {t(node.node_type, language)}
            </Badge>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex flex-wrap items-center gap-4 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <span className="font-medium">{t('version', language)}:</span>
            <span>{node.version}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="font-medium">{t('updated', language)}:</span>
            <span>{formatTimestamp(node.updated_at)}</span>
          </div>
          {node.is_section && (
            <Badge variant="outline" className="text-xs">
              Section
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}