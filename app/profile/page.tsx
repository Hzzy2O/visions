'use client';

import { useEffect } from 'react';
import { useCurrentAccount } from '@mysten/dapp-kit';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const account = useCurrentAccount();
  const router = useRouter();

  useEffect(() => {
    if (account?.address) {
      router.replace(`/profile/${account.address}`);
    }
  }, [account?.address, router]);

  if (!account?.address) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <button style={{ fontSize: 20, padding: '12px 32px' }}>Connect Wallet</button>
      </div>
    );
  }

  return null;
}
