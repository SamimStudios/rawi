import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { History as HistoryIcon } from 'lucide-react';

const History = () => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth/sign-in');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F1320] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  // Mock data
  const historyData = [
    {
      id: '1',
      title: 'Epic Action Trailer',
      date: '2024-01-15',
      status: 'success',
      resultUrl: '#'
    },
    {
      id: '2',
      title: 'Romantic Drama Teaser',
      date: '2024-01-12',
      status: 'running',
      resultUrl: null
    },
    {
      id: '3',
      title: 'Sci-Fi Adventure',
      date: '2024-01-10',
      status: 'failed',
      resultUrl: null
    }
  ];

  const getStatusBadge = (status: string) => {
    const variants: Record<string, 'default' | 'secondary' | 'destructive'> = {
      success: 'default',
      running: 'secondary',
      failed: 'destructive',
      queued: 'secondary'
    };

    const labels: Record<string, string> = {
      success: t('statusSuccess'),
      running: t('statusRunning'),
      failed: t('statusFailed'),
      queued: t('statusQueued')
    };

    return (
      <Badge variant={variants[status] || 'default'}>
        {labels[status] || status}
      </Badge>
    );
  };

  return (
    <div className="min-h-screen bg-[#0F1320]">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-6xl mx-auto">
          {/* Page Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <HistoryIcon className="w-8 h-8 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                {t('myHistory')}
              </h1>
            </div>
          </div>

          {/* History Table */}
          <Card className="bg-card border-border">
            <CardHeader>
              <CardTitle className="text-foreground">{t('myHistory')}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-foreground">{t('title')}</TableHead>
                    <TableHead className="text-foreground">{t('date')}</TableHead>
                    <TableHead className="text-foreground">{t('status')}</TableHead>
                    <TableHead className="text-foreground">{t('result')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {historyData.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="text-foreground font-medium">
                        {item.title}
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {new Date(item.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(item.status)}
                      </TableCell>
                      <TableCell>
                        {item.resultUrl ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-primary border-primary hover:bg-primary/10"
                          >
                            {t('viewResult')}
                          </Button>
                        ) : (
                          <span className="text-muted-foreground text-sm">—</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default History;