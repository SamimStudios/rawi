import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Wallet as WalletIcon, CreditCard, Eye, Plus, Minus } from 'lucide-react';

const Wallet = () => {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [showTransactions, setShowTransactions] = useState(false);

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

  // Mock transaction data
  const transactions = [
    {
      id: '1',
      type: 'purchase',
      amount: 100,
      date: '2024-01-15',
      description: 'Credit pack purchase'
    },
    {
      id: '2',
      type: 'generation',
      amount: -20,
      date: '2024-01-14',
      description: 'Cinematic trailer generation'
    },
    {
      id: '3',
      type: 'generation',
      amount: -10,
      date: '2024-01-12',
      description: 'Character generation'
    }
  ];

  return (
    <div className="min-h-screen bg-[#0F1320]">
      <main className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Page Header */}
          <div className="mb-12">
            <div className="flex items-center gap-3 mb-4">
              <WalletIcon className="w-8 h-8 text-primary" />
              <h1 className="text-4xl md:text-5xl font-bold text-white">
                {t('wallet')}
              </h1>
            </div>
          </div>

          {/* Balance Card */}
          <div className="mb-8">
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-foreground">
                  <CreditCard className="w-6 h-6 text-primary" />
                  {t('walletBalance')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-4xl font-bold text-primary mb-2">
                      120 {t('credits')}
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {t('creditsExpiry')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Action Buttons */}
          <div className="mb-8 flex flex-col sm:flex-row gap-4">
            <Button 
              className="bg-gradient-auth hover:opacity-90 text-white border-0 flex-1"
              size="lg"
            >
              <Plus className="w-5 h-5 mr-2" />
              {t('buyCredits')}
            </Button>
            <Button 
              variant="outline"
              onClick={() => setShowTransactions(!showTransactions)}
              className="text-primary border-primary hover:bg-primary/10 flex-1"
              size="lg"
            >
              <Eye className="w-5 h-5 mr-2" />
              {t('viewTransactions')}
            </Button>
          </div>

          {/* Transactions Table */}
          {showTransactions && (
            <Card className="bg-card border-border">
              <CardHeader>
                <CardTitle className="text-foreground">Transaction History</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-foreground">{t('transactionType')}</TableHead>
                      <TableHead className="text-foreground">{t('transactionAmount')}</TableHead>
                      <TableHead className="text-foreground">{t('transactionDate')}</TableHead>
                      <TableHead className="text-foreground">Description</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-foreground font-medium">
                          <div className="flex items-center gap-2">
                            {transaction.type === 'purchase' ? (
                              <Plus className="w-4 h-4 text-green-500" />
                            ) : (
                              <Minus className="w-4 h-4 text-red-500" />
                            )}
                            {transaction.type === 'purchase' ? t('purchase') : t('generation')}
                          </div>
                        </TableCell>
                        <TableCell className={`font-medium ${
                          transaction.amount > 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {transaction.amount > 0 ? '+' : ''}{transaction.amount}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {transaction.description}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
};

export default Wallet;