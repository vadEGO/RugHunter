"use client";

import { useState } from 'react';
import { WalletInputForm } from '@/components/rug-hunter/wallet-input-form';
import { WalletSearchForm } from '@/components/rug-hunter/wallet-search-form';
import { StatusIndicator, type StatusDisplayType } from '@/components/rug-hunter/status-indicator';
import { useRuggedWallets } from '@/hooks/use-rugged-wallets';
import { Separator } from '@/components/ui/separator';
import { Github, ShieldCheck } from 'lucide-react';

export default function RugHunterPage() {
  const { addWallet, isWalletRugged, isLoaded } = useRuggedWallets();
  const [searchResult, setSearchResult] = useState<{ status: StatusDisplayType; address?: string; message?: string }>({
    status: 'idle',
  });

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
          Identify and track scammer crypto wallets. Stay safe in the DeFi space.
        </p>
      </header>

      <main className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
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
      </main>

      <footer className="mt-16 text-center text-muted-foreground text-sm">
        <p>&copy; {new Date().getFullYear()} Rug Hunter. All rights reserved.</p>
        <a 
          href="https://github.com/your-github-repo" // Replace with actual link
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
