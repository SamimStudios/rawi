import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Node } from '../types/node';
import { getNodeTypeIcon, getNodeTypeColor } from '../utils/nodeHelpers';
import { useLanguage } from '@/contexts/LanguageContext';
import { t, getTextDirection } from '../utils/i18n';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

interface GroupRendererProps {
  node: Node;
  children?: Node[];
}

export function GroupRenderer({ node, children = [] }: GroupRendererProps) {
  const { language } = useLanguage();
  const textDirection = getTextDirection(language);

  return (
    <div className="space-y-4" dir={textDirection}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>📁</span>
            <span>{t('group', language)} Content</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-muted/30 rounded-md">
            <pre className="text-sm text-muted-foreground">
              {JSON.stringify(node.content, null, 2)}
            </pre>
          </div>
        </CardContent>
      </Card>

      {/* Children */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span>{t('children', language)}</span>
            <Badge variant="outline">{children.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {children.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              {t('noChildren', language)}
            </p>
          ) : (
            <div className="space-y-2">
              {children.map((child) => (
                <Link
                  key={child.id}
                  to={`/nodes/${child.id}`}
                  className="block"
                >
                  <div className="flex items-center justify-between p-3 rounded-md border border-border hover:bg-muted/50 transition-colors group">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="text-lg">
                        {getNodeTypeIcon(child.node_type)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">
                            {child.path.split('.').pop() || 'Node'}
                          </span>
                          <Badge className={`text-xs ${getNodeTypeColor(child.node_type)}`}>
                            {t(child.node_type, language)}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground font-mono truncate">
                          {child.path}
                        </p>
                      </div>
                    </div>
                    <ChevronRight className={`h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors ${
                      language === 'ar' ? 'rotate-180' : ''
                    }`} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}