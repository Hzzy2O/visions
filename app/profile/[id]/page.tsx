'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus, Edit, Trash2 } from 'lucide-react';
import ContentCard from '@/components/content-card';
import { useCurrentAccount, useSignPersonalMessage, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { network, networkConfig, suiClient } from '@/contracts';
import { generateColorFromAddress } from '@/lib/utils';
import { SessionKey } from '@mysten/seal';
import { Transaction } from '@mysten/sui/transactions';
import dynamic from 'next/dynamic';
import MySubscriptions from './MySubscriptions';

const packageId = networkConfig[network].variables.package;

function Skeleton({ className = '' }) {
  return <div className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded ${className}`} />;
}

const SubscriptionServiceManager = dynamic(() => import('./SubscriptionServiceManager'), {
  loading: () => <Skeleton className="h-40 w-full" />, // fallback skeleton
  ssr: false,
});

export default function ProfilePage() {
  const params = useParams();
  const creatorAddr = params.id as string;
  const account = useCurrentAccount();
  const [creator, setCreator] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [contents, setContents] = useState<any[]>([]);
  const [loadingContents, setLoadingContents] = useState(false);
  const [sessionKey, setSessionKey] = useState<SessionKey | null>(null);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [subscribeSuccess, setSubscribeSuccess] = useState(false);
  const { mutate: signPersonalMessage } = useSignPersonalMessage();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [coins, setCoins] = useState<any[]>([]);
  const [coinLoading, setCoinLoading] = useState(false);
  const [coinError, setCoinError] = useState<string | null>(null);
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'service' | 'publication' | 'subscription'>('service');
  const isSelf = account?.address === creatorAddr;

  // 拉取创作者信息
  useEffect(() => {
    const fetchCreator = async () => {
      setLoading(true);
      if (!creatorAddr) {
        setCreator(null);
        setLoading(false);
        return;
      }
      try {
        // 用 getOwnedObjects 查找 Creator 对象
        const objects = await suiClient.getOwnedObjects({
          owner: creatorAddr,
          filter: {
            StructType: `${packageId}::creator::Creator`,
          },
          options: { showContent: true },
        });
        const obj: any = (objects.data || [])[0];
        if (!obj || !obj.data?.content?.fields) {
          setCreator(null);
        } else {
          const content = obj.data.content.fields;
          setCreator({
            id: obj.data.objectId,
            name: content.name,
            bio: content.description,
            subscriptionPrice: Number(content.subscription_price) / 1_000_000_000,
            avatar: content.avatar_url,
            coverImage: content.cover_url,
          });
        }
      } catch (e) {
        setCreator(null);
      } finally {
        setLoading(false);
      }
    };
    fetchCreator();
  }, [creatorAddr]);

  // 拉取创作者内容列表
  useEffect(() => {
    const fetchContents = async () => {
      setLoadingContents(true);
      setContents([]);
      if (!creatorAddr) {
        setLoadingContents(false);
        return;
      }
      try {
        // Query all Content objects, filter by creator_id
        const objects = await suiClient.getOwnedObjects({
          owner: creatorAddr, // This may need to be adjusted depending on actual ownership model
          filter: {
            StructType: `${packageId}::content::Content`,
          },
          options: { showContent: true },
        });
        // Filter content by creator_id field
        const list = (objects.data || []).map((obj: any) => {
          const content = obj.data?.content?.fields;
          if (!content) return null;
          if (content.creator_id !== creatorAddr) return null;
          return {
            id: obj.data?.objectId,
            title: content.title,
            description: content.description ?? '',
            walrusReference: content.walrus_reference,
            previewReference: content.preview_reference,
            contentType: content.content_type,
            createdAt: content.created_at,
            creatorAddr ,
          };
        }).filter(Boolean);
        setContents(list);
      } catch (e) {
        setContents([]);
      } finally {
        setLoadingContents(false);
      }
    };
    fetchContents();
  }, [creatorAddr]);

  // 拉取 Service 对象
  useEffect(() => {
    const fetchService = async () => {
      if (!creatorAddr) return;
      const objects = await suiClient.getOwnedObjects({
        owner: creatorAddr,
        filter: { StructType: `${packageId}::subscription::Service` },
        options: { showContent: true },
      });
      const obj = (objects.data || [])[0];
      setServiceId(obj?.data?.objectId || null);
    };
    fetchService();
  }, [creatorAddr]);

  // 拉取当前账户 SUI Coin 列表
  useEffect(() => {
    const fetchCoins = async () => {
      setCoinLoading(true);
      setCoinError(null);
      setCoins([]);
      if (!account?.address) {
        setCoinLoading(false);
        return;
      }
      try {
        // 获取 SUI Coin 对象
        const resp = await suiClient.getCoins({ owner: account.address, coinType: '0x2::sui::SUI' });
        setCoins(resp.data || []);
      } catch (e) {
        setCoinError('Failed to fetch SUI coins');
      } finally {
        setCoinLoading(false);
      }
    };
    fetchCoins();
  }, [account?.address]);

  // 订阅处理逻辑
  const handleSubscribe = async () => {
    if (!account?.address || !creator) return;
    setSubscribing(true);
    setCoinError(null);
    try {
      // 1. 校验 Coin 列表
      if (coins.length === 0) {
        setCoinError('No SUI coins available for payment.');
        return;
      }
      // 2. 计算所需支付金额（单位：MIST）
      const amount = Math.ceil(creator.subscriptionPrice * 1_000_000_000); // 1 SUI = 1e9 MIST
      // 3. 选择余额足够的 Coin
      const coin = coins.find((c) => Number(c.balance) >= amount);
      if (!coin) {
        setCoinError('Insufficient SUI balance for subscription.');
        return;
      }
      // 4. 检查 serviceId
      if (!serviceId) {
        setCoinError('Service not found.');
        return;
      }
      // 5. 构造交易
      const tx = new Transaction();
      // 获取 clock objectId（假设为0x6，实际可查链上）
      const clockObjectId = '0x6';
      // 订阅合约调用，传递 user_addr, service, payment(Coin<SUI>), clock
      tx.moveCall({
        target: `${packageId}::subscription::subscribe`,
        arguments: [
          tx.pure.address(account.address),
          tx.object(serviceId),
          tx.object(coin.coinObjectId),
          tx.object(clockObjectId),
        ],
      });
      await signAndExecute({ transaction: tx }, {
        onSuccess: () => {
          setSubscribeSuccess(true);
        },
        onError: () => {
          setSubscribeSuccess(false);
        },
      });
    } finally {
      setSubscribing(false);
      setShowSubscribeModal(false);
    }
  };

  if (loading) {
    return (
      <div className="container flex h-[60vh] items-center justify-center py-8 md:py-12">
        <p className="text-xl">Loading profile...</p>
      </div>
    );
  }

  return (
    <div className="container py-8 md:py-12">
      {/* Profile Header with Cover */}
      <div className="relative">
        {/* Cover Image + 头像悬浮 */}
        <div className="relative flex items-center justify-center  h-48 w-full overflow-hidden rounded-xl">
          <Image
            src={creator ? creator.coverImage || '/placeholder.svg?key=cover' : '/placeholder.svg?key=cover'}
            alt="Cover"
            fill
            className="object-cover"
          />
          {/* 头像绝对定位悬浮 */}
          <div
            className="z-10 rounded-full"
            style={{
              width: 128,
              height: 128,
              background: generateColorFromAddress(creatorAddr || ''),
              fontSize: 48,
              color: '#fff',
              fontWeight: 'bold',
              userSelect: 'none',
              overflow: 'hidden',
              border: '4px solid #fff',
              boxShadow: '0 2px 12px 0 rgba(0,0,0,0.08)',
            }}
          >
          </div>
        </div>
      </div>

      {/* Profile Info Section with Skeleton */}
      {loading ? (
        <div className="flex flex-col items-center w-full mb-8">
          <Skeleton className="h-8 w-40 mb-4" />
          <Skeleton className="h-4 w-64 mb-2" />
          <Skeleton className="h-10 w-32 mt-4" />
        </div>
      ) : (
        <div className="flex flex-col items-center w-full mb-8">
          <h1 className="mt-4 text-2xl font-bold">{creator?.name}</h1>
          <p className="mt-2 max-w-md text-muted-foreground">{creator?.bio}</p>
          {!creator && account?.address === creatorAddr && (
            <Button
              className="mt-4"
              onClick={() => {
                window.location.href = '/creator/setup';
              }}
            >
              Become creator
            </Button>
          )}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-4 border-b mb-6">
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'service' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('service')}
        >
          Service
        </button>
        <button
          className={`py-2 px-4 font-medium ${activeTab === 'publication' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
          onClick={() => setActiveTab('publication')}
        >
          Publication
        </button>
        {isSelf && (
          <button
            className={`py-2 px-4 font-medium ${activeTab === 'subscription' ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-500'}`}
            onClick={() => setActiveTab('subscription')}
          >
            Subscription
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="mt-4">
        {activeTab === 'service' && (
          <SubscriptionServiceManager creatorAddr={creatorAddr} isSelf={isSelf} />
        )}
        {activeTab === 'publication' && (
          <div>
            {loadingContents ? (
              <>
                <Skeleton className="h-32 w-full mb-4" />
                <Skeleton className="h-32 w-full mb-4" />
              </>
            ) : contents.length === 0 ? (
              <div className="text-gray-400">No publications yet.</div>
            ) : (
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {contents.map((item) => (
                  <ContentCard key={item.id} {...item} />
                ))}
              </div>
            )}
          </div>
        )}
        {activeTab === 'subscription' && isSelf && (
          <div>
            {/* 展示用户订阅列表 */}
            <MySubscriptions accountAddr={account?.address || ''} />
          </div>
        )}
      </div>

      {/* 订阅确认弹窗 */}
      {showSubscribeModal && creator && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-8 shadow-lg w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Confirm Subscription</h3>
            <p className="mb-2">Subscribe to <span className="font-semibold">{creator.name}</span> for <span className="text-blue-600">{creator.subscriptionPrice} SUI</span> / month?</p>
            {/* 支付相关错误提示 */}
            {coinError && <div className="text-red-500 mb-2 text-sm">{coinError}</div>}
            <div className="flex gap-4 mt-6">
              <Button className="flex-1 bg-blue text-white" onClick={handleSubscribe} disabled={subscribing || coinLoading}>
                {subscribing ? 'Subscribing...' : coinLoading ? 'Checking...' : 'Confirm'}
              </Button>
              <Button className="flex-1" variant="secondary" onClick={() => setShowSubscribeModal(false)} disabled={subscribing}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* 订阅成功提示 */}
      {subscribeSuccess && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg p-8 shadow-lg w-full max-w-md text-center">
            <h3 className="text-xl font-bold mb-4">Subscription Successful!</h3>
            <Button className="mt-4 bg-blue text-white" onClick={() => setSubscribeSuccess(false)}>
              OK
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 
