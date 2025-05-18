'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SuiClientProvider, WalletProvider } from '@mysten/dapp-kit';
import { networkConfig, network } from '@/contracts';
import '@mysten/dapp-kit/dist/index.css';
import { TransactionNotifierProvider } from '@/components/ui/TransactionNotifier';

const queryClient = new QueryClient();

export function Providers({ children }: { children: React.ReactNode }) {
  return (
      <TransactionNotifierProvider>
        <QueryClientProvider client={queryClient}>
          <SuiClientProvider networks={networkConfig} defaultNetwork={network}>
            <WalletProvider autoConnect={true}>{children}</WalletProvider>
          </SuiClientProvider>
        </QueryClientProvider>
      </TransactionNotifierProvider>
  );
}
