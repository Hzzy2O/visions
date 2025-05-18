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
    } else {
      router.replace('/not-found');
    }
  }, [account?.address, router]);

  return null;
}
