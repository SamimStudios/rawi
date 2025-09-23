import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Info } from 'lucide-react';

interface GroupContentEditorProps {
  content: Record<string, any>;
  onChange: (content: Record<string, any>) => void;
}

export function GroupContentEditor({ content, onChange }: GroupContentEditorProps) {
  // Group nodes have empty content by design
  React.useEffect(() => {
    if (Object.keys(content).length > 0) {
      onChange({});
    }
  }, [content, onChange]);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-medium">Group Node Configuration</h3>
        <p className="text-sm text-muted-foreground">
          Group nodes are container nodes with no content configuration required
        </p>
      </div>

      <Card className="border-dashed">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <Info className="w-8 h-8 text-muted-foreground" />
            </div>
            <div className="space-y-1">
              <p className="font-medium">No Configuration Needed</p>
              <p className="text-sm text-muted-foreground max-w-sm">
                Group nodes serve as containers to organize other nodes. 
                They have an empty content structure by design.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-xs text-muted-foreground bg-muted/50 p-3 rounded-md">
        <strong>Technical Note:</strong> Group nodes maintain an empty JSON object ({}) as their content. 
        This is validated by the database constraint and allows the node to serve as a structural container 
        for organizing child nodes in the application hierarchy.
      </div>
    </div>
  );
}