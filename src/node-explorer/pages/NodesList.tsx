import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, RefreshCw, Search, Eye, Filter } from 'lucide-react';
import { useNodesList } from '../hooks/useNodesList';
import { useLanguage } from '@/contexts/LanguageContext';
import { getNodeTypeIcon, getNodeTypeColor, formatTimestamp } from '../utils/nodeHelpers';
import { t, getTextDirection } from '../utils/i18n';
import { LanguageToggle } from '../components/LanguageToggle';

export function NodesList() {
  const { language } = useLanguage();
  const [search, setSearch] = useState('');
  const [nodeTypeFilter, setNodeTypeFilter] = useState<string>('all');
  const [jobIdFilter, setJobIdFilter] = useState<string>('all');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const textDirection = getTextDirection(language);

  // Debounce search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const { data, loading, error, refetch } = useNodesList({
    search: debouncedSearch,
    nodeType: nodeTypeFilter === 'all' ? undefined : nodeTypeFilter,
    jobId: jobIdFilter === 'all' ? undefined : jobIdFilter,
    limit: 100
  });

  console.log('NodesList render:', { data, loading, error, search: debouncedSearch, nodeTypeFilter, jobIdFilter });

  // Extract unique job IDs for filter dropdown
  const uniqueJobIds = useMemo(() => {
    if (!data?.nodes) return [];
    const ids = [...new Set(data.nodes.map(node => node.job_id))];
    return ids.slice(0, 10); // Limit to first 10 for dropdown
  }, [data?.nodes]);

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
                  Loading nodes...
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
                  {error || 'Failed to load nodes'}
                </p>
                <Button onClick={refetch} variant="outline">
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

  return (
    <div className="min-h-screen bg-background" dir={textDirection}>
      {/* Header */}
      <div className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold">All Storyboard Nodes</h1>
              <p className="text-muted-foreground">
                Browse and explore all nodes in the system
              </p>
            </div>
            <LanguageToggle />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="border-b border-border bg-muted/30">
        <div className="container mx-auto p-4">
          <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="flex-1 min-w-[300px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search nodes by path or type..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Node Type Filter */}
            <Select value={nodeTypeFilter} onValueChange={setNodeTypeFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">All Types</SelectItem>
                <SelectItem value="group">Group</SelectItem>
                <SelectItem value="form">Form</SelectItem>
                <SelectItem value="media">Media</SelectItem>
              </SelectContent>
            </Select>

            {/* Job ID Filter */}
            {uniqueJobIds.length > 0 && (
              <Select value={jobIdFilter} onValueChange={setJobIdFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="All Jobs" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Jobs</SelectItem>
                  {uniqueJobIds.map((jobId) => (
                    <SelectItem key={jobId} value={jobId}>
                      {jobId.slice(0, 8)}...
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <Button onClick={refetch} variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="container mx-auto p-4">
        <div className="flex items-center gap-4 mb-4">
          <Badge variant="outline" className="text-sm">
            Total: {data.pagination.total}
          </Badge>
          <Badge variant="outline" className="text-sm">
            Showing: {data.nodes.length}
          </Badge>
          {debouncedSearch && (
            <Badge variant="secondary" className="text-sm">
              Filtered by: "{debouncedSearch}"
            </Badge>
          )}
          {nodeTypeFilter && (
            <Badge className={getNodeTypeColor(nodeTypeFilter)}>
              {nodeTypeFilter}
            </Badge>
          )}
        </div>

        {/* Nodes Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>📋</span>
              <span>Storyboard Nodes</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data.nodes.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <AlertCircle className="h-12 w-12 mx-auto mb-4" />
                <p>No nodes found matching your criteria</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Path</TableHead>
                    <TableHead>Job ID</TableHead>
                    <TableHead>Version</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.nodes.map((node) => (
                    <TableRow key={node.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{getNodeTypeIcon(node.node_type)}</span>
                          <Badge className={getNodeTypeColor(node.node_type)}>
                            {t(node.node_type, language)}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <code className="text-sm bg-muted/50 px-2 py-1 rounded">
                          {node.path}
                        </code>
                      </TableCell>
                      <TableCell>
                        <code className="text-xs text-muted-foreground">
                          {node.job_id.slice(0, 8)}...
                        </code>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">v{node.version}</Badge>
                      </TableCell>
                      <TableCell>
                        {node.is_section ? (
                          <Badge variant="secondary" className="text-xs">
                            Section
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {formatTimestamp(node.updated_at)}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="outline"
                          size="sm"
                          asChild
                        >
                          <Link to={`/nodes/${node.id}`}>
                            <Eye className="h-4 w-4 mr-2" />
                            View
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}

            {/* Pagination info */}
            {data.pagination.total > data.nodes.length && (
              <div className="mt-4 text-sm text-muted-foreground text-center">
                Showing {data.nodes.length} of {data.pagination.total} total nodes
                {data.pagination.hasMore && " (load more coming soon)"}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}