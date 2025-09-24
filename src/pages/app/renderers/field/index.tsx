import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { RefreshCw, Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import SystematicFieldRenderer from '@/components/renderers/SystematicFieldRenderer';
import { useFields, type FieldEntry } from '@/hooks/useFields';
import { cn } from '@/lib/utils';

export default function FieldRendererPreview() {
  const { entries, loading, error, fetchEntries } = useFields();
  const [fieldValues, setFieldValues] = useState<Record<string, any>>({});
  const [searchQuery, setSearchQuery] = useState('');
  const [filterWidget, setFilterWidget] = useState<string>('all');
  const [filterDatatype, setFilterDatatype] = useState<string>('all');

  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Filter fields based on search and filters
  const filteredFields = entries.filter((field) => {
    const matchesSearch = field.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (field.ui?.label?.fallback || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesWidget = filterWidget === 'all' || field.widget === filterWidget;
    const matchesDatatype = filterDatatype === 'all' || field.datatype === filterDatatype;
    
    return matchesSearch && matchesWidget && matchesDatatype;
  });

  // Get unique widgets and datatypes for filters
  const uniqueWidgets = [...new Set(entries.map(field => field.widget))];
  const uniqueDatatypes = [...new Set(entries.map(field => field.datatype))];

  const handleFieldValueChange = (fieldId: string, value: any) => {
    setFieldValues(prev => ({
      ...prev,
      [fieldId]: value
    }));
  };

  const getWidgetColor = (widget: string) => {
    const colors: Record<string, string> = {
      text: 'bg-blue-100 text-blue-800',
      textarea: 'bg-blue-100 text-blue-800',
      select: 'bg-green-100 text-green-800',
      radio: 'bg-green-100 text-green-800',
      checkbox: 'bg-yellow-100 text-yellow-800',
      tags: 'bg-purple-100 text-purple-800',
      date: 'bg-orange-100 text-orange-800',
      time: 'bg-orange-100 text-orange-800',
      email: 'bg-cyan-100 text-cyan-800',
      url: 'bg-cyan-100 text-cyan-800',
      number: 'bg-pink-100 text-pink-800',
      file: 'bg-gray-100 text-gray-800',
    };
    return colors[widget] || 'bg-gray-100 text-gray-800';
  };

  const getDatatypeColor = (datatype: string) => {
    const colors: Record<string, string> = {
      string: 'bg-emerald-100 text-emerald-800',
      array: 'bg-violet-100 text-violet-800',
      number: 'bg-rose-100 text-rose-800',
      boolean: 'bg-amber-100 text-amber-800',
      object: 'bg-slate-100 text-slate-800',
    };
    return colors[datatype] || 'bg-gray-100 text-gray-800';
  };

  if (loading && entries.length === 0) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <RefreshCw className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading field registry...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="border-destructive">
          <CardContent className="p-6">
            <p className="text-destructive">Error loading fields: {error}</p>
            <Button onClick={fetchEntries} className="mt-4">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Field Renderer Preview</h1>
          <p className="text-muted-foreground">
            Preview all field renderers from the registry ({filteredFields.length} of {entries.length} fields)
          </p>
        </div>
        <Button onClick={fetchEntries} variant="outline" disabled={loading}>
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
              <Search className="h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search fields..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="flex-1"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={filterWidget} onValueChange={setFilterWidget}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Widget" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Widgets</SelectItem>
                  {uniqueWidgets.map(widget => (
                    <SelectItem key={widget} value={widget}>{widget}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={filterDatatype} onValueChange={setFilterDatatype}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {uniqueDatatypes.map(datatype => (
                    <SelectItem key={datatype} value={datatype}>{datatype}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Field Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredFields.map((field) => (
          <Card key={field.id} className="flex flex-col">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg truncate">{field.id}</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    {field.ui?.label?.fallback || field.ui?.label?.key || 'No label'}
                  </p>
                </div>
                <div className="flex flex-col gap-1 items-end">
                  <Badge className={cn("text-xs", getWidgetColor(field.widget))}>
                    {field.widget}
                  </Badge>
                  <Badge variant="outline" className={cn("text-xs", getDatatypeColor(field.datatype))}>
                    {field.datatype}
                  </Badge>
                </div>
              </div>
              
              {field.ui?.help?.fallback && (
                <p className="text-xs text-muted-foreground bg-muted/50 p-2 rounded">
                  {field.ui.help.fallback}
                </p>
              )}
            </CardHeader>
            
            <Separator />
            
            <CardContent className="flex-1 p-4">
              <div className="space-y-4">
                {/* Field Preview */}
                <div className="bg-muted/30 p-4 rounded-lg">
                  <SystematicFieldRenderer
                    field={field}
                    value={fieldValues[field.id]}
                    onChange={(value) => handleFieldValueChange(field.id, value)}
                  />
                </div>
                
                {/* Current Value Display */}
                {fieldValues[field.id] !== undefined && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Current Value:</label>
                    <pre className="text-xs bg-muted p-2 rounded overflow-auto max-h-20">
                      {JSON.stringify(fieldValues[field.id], null, 2)}
                    </pre>
                  </div>
                )}
                
                {/* Rules Display */}
                {field.rules && Object.keys(field.rules).length > 0 && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">Rules:</label>
                    <div className="flex flex-wrap gap-1">
                      {Object.entries(field.rules).map(([key, value]) => (
                        <Badge key={key} variant="secondary" className="text-xs">
                          {key}: {String(value)}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Options Display */}
                {field.options?.values && (
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-muted-foreground">
                      Options ({field.options.values.length}):
                    </label>
                    <div className="max-h-16 overflow-auto">
                      <div className="flex flex-wrap gap-1">
                        {field.options.values.slice(0, 5).map((option: any, index: number) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {option.label?.fallback || option.value}
                          </Badge>
                        ))}
                        {field.options.values.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{field.options.values.length - 5} more
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFields.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No fields match your current filters.</p>
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchQuery('');
                setFilterWidget('all');
                setFilterDatatype('all');
              }}
              className="mt-4"
            >
              Clear Filters
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}