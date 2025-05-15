
"use client";

import { useState } from 'react';
import { WalletInputForm } from '@/components/rug-hunter/wallet-input-form';
import { WalletSearchForm } from '@/components/rug-hunter/wallet-search-form';
import { StatusIndicator, type StatusDisplayType } from '@/components/rug-hunter/status-indicator';
import { useRuggedWallets } from '@/hooks/use-rugged-wallets';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Github, ShieldCheck, Search, ListChecks, Loader2, PlusCircle, Download } from 'lucide-react';

export default function RugHunterPage() {
  const { wallets, addWallet, isWalletRugged, isLoaded } = useRuggedWallets();
  const [searchResult, setSearchResult] = useState<{ status: StatusDisplayType; address?: string; message?: string }>({
    status: 'idle',
  });

  const handleDownloadCSV = () => {
    if (wallets.length === 0) return;

    const csvHeader = "Solana Wallet Address\n"; // Updated CSV Header
    const csvRows = wallets.map(wallet => `"${wallet}"`).join("\n");
    const csvContent = csvHeader + csvRows;

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    if (link.download !== undefined) {
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", "rugged_solana_wallets.csv"); // Updated filename
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-background">
      <header className="mb-10 text-center">
        <div className="flex items-center justify-center mb-2">
           <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-16 h-16 text-primary mr-3">
            <path fillRule="evenodd" d="M10.5 3.75a6.75 6.75 0 100 13.5 6.75 6.75 0 000-13.5zM2.25 10.5a8.25 8.25 0 1114.59 5.28l4.69 4.69a.75.75 0 11-1.06 1.06l-4.69-4.69A8.25 8.25 0 012.25 10.5z" clipRule="evenodd" />
          </svg>
          <h1 className="text-5xl font-bold text-primary">Rug Hunter</h1>
        </div>
        <p className="text-lg text-muted-foreground">
          Identify and track scammer Solana crypto wallets. Stay safe in the Solana DeFi space.
        </p>
      </header>

      <main className="w-full max-w-4xl">
        <Tabs defaultValue="hunter-tools" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-8 shadow-sm">
            <TabsTrigger value="hunter-tools">
              <Search className="mr-2 h-4 w-4" />
              Hunter Tools
            </TabsTrigger>
            <TabsTrigger value="rugged-list">
              <ListChecks className="mr-2 h-4 w-4" />
              Rugged Solana Wallets ({wallets.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="hunter-tools">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
              <div className="space-y-8">
                <WalletSearchForm
                  isWalletRuggedAction={isWalletRugged}
                  setSearchResult={setSearchResult}
                />
                {isLoaded && <StatusIndicator {...searchResult} />}
                {!isLoaded && (
                  <div className="mt-6 p-6 bg-card rounded-lg shadow-md flex flex-col items-center text-center">
                      <ShieldCheck className={`h-12 w-12 mb-3 text-muted-foreground`} />
                      <p className={`text-lg font-semibold text-muted-foreground`}>Loading wallet data...</p>
                  </div>
                )}
              </div>

              <WalletInputForm addWalletAction={addWallet} />
            </div>
          </TabsContent>

          <TabsContent value="rugged-list">
            <Card className="w-full shadow-xl">
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-2xl">Known Rugged Solana Wallet Addresses</CardTitle>
                  <Button
                    onClick={handleDownloadCSV}
                    disabled={wallets.length === 0 || !isLoaded}
                    variant="outline"
                  >
                    <Download className="mr-2 h-4 w-4" />
                    Download CSV
                  </Button>
                </div>
                <CardDescription>This list contains Solana addresses that have been reported as scams and added via the Hunter Tools.</CardDescription>
              </CardHeader>
              <CardContent>
                {!isLoaded && (
                  <div className="flex items-center justify-center p-10">
                    <Loader2 className="h-10 w-10 animate-spin text-primary" />
                    <p className="ml-3 text-lg text-muted-foreground">Loading wallet list...</p>
                  </div>
                )}
                {isLoaded && wallets.length === 0 && (
                  <p className="text-muted-foreground text-center p-10 text-lg">
                    No rugged Solana wallets have been added yet. Use the <PlusCircle className="inline h-5 w-5 relative -top-px mx-1" /> "Add Rugged Solana Wallet" tool.
                  </p>
                )}
                {isLoaded && wallets.length > 0 && (
                  <ScrollArea className="h-[400px] pr-4 border rounded-md p-4">
                    <div className="space-y-2">
                      {wallets.map((wallet, index) => (
                        <Badge
                          key={index}
                          variant="destructive"
                          className="w-full text-left block truncate p-2.5 text-sm font-mono shadow-sm"
                          title={wallet} // Show full wallet on hover
                        >
                          {wallet}
                        </Badge>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      <footer className="mt-16 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} Rug Hunter. All rights reserved.</p>
        <a
          href="https://github.com/vadEGO/RugHunter"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center hover:text-primary transition-colors mt-2"
        >
          <Github className="h-4 w-4 mr-1" />
          View on GitHub
        </a>
      </footer>
    </div>
  );
}
