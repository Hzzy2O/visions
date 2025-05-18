import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useCurrentAccount, useSignAndExecuteTransaction } from '@mysten/dapp-kit';
import { network, networkConfig, suiClient } from '@/contracts';
import { Transaction } from '@mysten/sui/transactions';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { useTransactionNotifier } from '@/components/ui/TransactionNotifier';
import Link from 'next/link';

const packageId = networkConfig[network].variables.package;

interface Service {
  id: string;
  fee: string;
  ttl: string;
  owner: string;
  creator_id: string;
}

type TtlUnit = 'day' | 'month' | 'year';

// 格式化 Service ID，只显示前6+...+后4
function formatId(id: string) {
  if (!id) return '';
  return `${id.slice(0, 6)}...${id.slice(-4)}`;
}

// 格式化 TTL
function formatTtl(ms: number) {
  if (ms >= 365 * 24 * 60 * 60 * 1000) {
    return `${(ms / (365 * 24 * 60 * 60 * 1000)).toFixed(1)} year(s)`;
  }
  if (ms >= 30 * 24 * 60 * 60 * 1000) {
    return `${(ms / (30 * 24 * 60 * 60 * 1000)).toFixed(1)} month(s)`;
  }
  if (ms >= 24 * 60 * 60 * 1000) {
    return `${(ms / (24 * 60 * 60 * 1000)).toFixed(1)} day(s)`;
  }
  if (ms >= 60 * 60 * 1000) {
    return `${(ms / (60 * 60 * 1000)).toFixed(1)} hour(s)`;
  }
  return `${(ms / 1000).toFixed(0)} second(s)`;
}

export default function SubscriptionServiceManager({ creatorAddr, isSelf }: { creatorAddr: string; isSelf?: boolean }) {
  const account = useCurrentAccount();
  const { mutate: signAndExecute } = useSignAndExecuteTransaction();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [fee, setFee] = useState('');
  const [ttlValue, setTtlValue] = useState('');
  const [ttlUnit, setTtlUnit] = useState<TtlUnit>('day');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshFlag, setRefreshFlag] = useState(0);
  const [creatorObjId, setCreatorObjId] = useState<string | null>(null);
  const { showTxStatus } = useTransactionNotifier();
  const [service, setService] = useState<Service | null>(null);
  const [showSubscribeModal, setShowSubscribeModal] = useState(false);
  const [subscribing, setSubscribing] = useState(false);
  const [coinError, setCoinError] = useState<string | null>(null);
  const [coins, setCoins] = useState<any[]>([]);
  const [isSubscribed, setIsSubscribed] = useState(false);

  // 拉取当前账户下的 Creator 对象ID
  useEffect(() => {
    if (!creatorAddr) {
      setCreatorObjId(null);
      return;
    }
    suiClient.getOwnedObjects({
      owner: creatorAddr,
      filter: { StructType: `${packageId}::creator::Creator` },
      options: { showContent: true },
    }).then(res => {
      const obj = (res.data || [])[0];
      setCreatorObjId(obj?.data?.objectId || null);
    });
  }, [creatorAddr]);

  // 通过事件查询所有 Service，再筛选当前 creator 的 service
  useEffect(() => {
    console.log('creatorObjId', creatorObjId);
    if (!creatorObjId) {
      setService(null);
      return;
    }
    setLoading(true);
    suiClient.queryEvents({
      query: {
        MoveEventType: `${packageId}::subscription::ServiceCreatedEvent`
      },
      limit: 100,
    })
      .then((res: any) => {
        console.log('res', res);
        // 只取 creator_id 匹配的 service
        const evt = (res.data || []).find((evt: any) => {
          const fields = evt.parsedJson;
          return fields && fields.creator_id === creatorObjId;
        });
        if (evt) {
          const fields = evt.parsedJson;
          setService({
            id: fields.service_id,
            fee: fields.fee,
            ttl: fields.ttl,
            owner: fields.owner,
            creator_id: fields.creator_id,
          });
        } else {
          setService(null);
        }
      })
      .finally(() => setLoading(false));
  }, [creatorObjId, refreshFlag]);

  // 通过事件判断当前用户是否已订阅该服务
  useEffect(() => {
    if (!account?.address || !creatorAddr) {
      setIsSubscribed(false);
      return;
    }
    setLoading(true);
    suiClient.queryEvents({
      query: {
        MoveEventType: `${packageId}::subscription::SubscriptionCreatedEvent`
      },
      limit: 100,
    })
      .then((res: any) => {
        // 只取 subscriber_addr 和 creator_addr 都匹配的事件
        const hasSubscribed = (res.data || []).some((evt: any) => {
          const fields = evt.parsedJson;
          return (
            fields &&
            fields.subscriber_addr === account.address &&
            fields.creator_addr === creatorAddr
          );
        });
        setIsSubscribed(hasSubscribed);
      })
      .finally(() => setLoading(false));
  }, [account?.address, creatorAddr, refreshFlag]);

  // 计算毫秒数
  const getTtlMs = () => {
    const value = Number(ttlValue);
    if (isNaN(value) || value <= 0) return 0;
    switch (ttlUnit) {
      case 'day': return value * 24 * 60 * 60 * 1000;
      case 'month': return value * 30 * 24 * 60 * 60 * 1000;
      case 'year': return value * 365 * 24 * 60 * 60 * 1000;
      default: return 0;
    }
  };

  // 创建服务（弹窗表单提交）
  const handleCreateService = async () => {
    setError(null);
    if (!account?.address) {
      setError('Please connect your wallet.');
      return;
    }
    if (!creatorObjId) {
      setError('No Creator object found. Please create a creator profile first.');
      return;
    }
    if (!fee || !ttlValue) {
      setError('Fee and duration are required.');
      return;
    }
    const feeMist = Math.round(Number(fee) * 1_000_000_000);
    if (isNaN(feeMist) || feeMist <= 0) {
      setError('Please enter a valid fee.');
      return;
    }
    const ttlMs = getTtlMs();
    if (!ttlMs) {
      setError('Please enter a valid duration.');
      return;
    }
    setCreating(true);
    try {
      const tx = new Transaction();
      tx.moveCall({
        target: `${packageId}::subscription::create_service_entry`,
        arguments: [
          tx.object(creatorObjId),
          tx.pure.u64(feeMist),
          tx.pure.u64(ttlMs),
        ],
      });
      await signAndExecute({ transaction: tx }, {
        onSuccess: async (result) => {
          setShowModal(false);
          showTxStatus('submitting', 'Submitting transaction...', result?.digest);
          try {
            await suiClient.waitForTransaction({ digest: result?.digest });
            const txDetails = await suiClient.getTransactionBlock({ digest: result?.digest });
            console.log('txDetails', txDetails);
            showTxStatus('completed', 'Service created successfully!', result?.digest);
            setFee('');
            setTtlValue('');
            setTtlUnit('day');
            setRefreshFlag(f => f + 1);
          } catch (error) {
            showTxStatus('failed', 'Create service failed.', result?.digest);
            setError('Create service failed.');
          }
        },
        onError: (e) => {
          showTxStatus('failed', 'Create service failed.');
          setError('Create service failed.');
        },
      });
    } finally {
      setCreating(false);
    }
  };

  // 拉取当前账户 SUI Coin
  useEffect(() => {
    if (!account?.address) return;
    suiClient.getCoins({ owner: account.address, coinType: '0x2::sui::SUI' })
      .then(resp => setCoins(resp.data || []));
  }, [account?.address]);

  // 订阅处理逻辑
  const handleSubscribe = async () => {
    if (!account?.address || !service) return;
    setSubscribing(true);
    setCoinError(null);
    try {
      const amount = BigInt(parseFloat(service.fee));
      
      const total = coins.reduce((sum, c) => sum + Number(c.balance), 0);
      if (total < amount) {
        setCoinError('Insufficient SUI balance.');
        return;
      }
      const tx = new Transaction();
      const [paymentCoin] = tx.splitCoins(tx.gas, [amount]);
      const clockObjectId = '0x6';
      tx.moveCall({
        target: `${packageId}::subscription::subscribe`,
        arguments: [
          tx.pure.address(account.address),
          tx.object(service.id),
          paymentCoin,
          tx.object(clockObjectId),
        ],
      });
      tx.setGasBudget(1000000000);
      await signAndExecute({ transaction: tx }, {
        onSuccess: async (result) => {
          showTxStatus('submitting', 'Submitting transaction...', result?.digest);
          setShowSubscribeModal(false);
          await suiClient.waitForTransaction({ digest: result?.digest });
          const txDetails = await suiClient.getTransactionBlock({ digest: result?.digest });
          console.log('txDetails', txDetails);
          showTxStatus('completed', 'Subscribed successfully!', result?.digest);
          setRefreshFlag(f => f + 1);
        },
        onError: () => {
          showTxStatus('failed', 'Subscribe failed.');
        },
      });
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <div className="mb-1 p-4 rounded-lg">
      {loading ? (
        <div>Loading service...</div>
      ) : service ? (
        <div className="max-w-md mx-auto bg-white dark:bg-gray-900 shadow-lg rounded-xl p-6 mt-4">
          <div className="flex items-center justify-between mb-4">
            <span className="text-lg font-semibold text-gray-800 dark:text-gray-100">Service Information</span>
            { isSubscribed ? (
              <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">Subscribed</span>
            ) : (
              <Button className="px-4 py-1 rounded-full" onClick={() => setShowSubscribeModal(true)}>
                Subscribe
              </Button>
            ) }
          </div>
          <div className="space-y-2">
            <div className="flex items-center">
              <span className="w-28 text-gray-500 dark:text-gray-400">Service ID:</span>
              <Link
                href={`https://suiexplorer.com/object/${service.id}?network=mainnet`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-blue-600 underline break-all"
              >
                {formatId(service.id)}
              </Link>
            </div>
            <div className="flex items-center">
              <span className="w-28 text-gray-500 dark:text-gray-400">Fee:</span>
              <span className="font-semibold text-gray-800 dark:text-gray-100">{Number(service.fee) / 1_000_000_000} SUI</span>
            </div>
            <div className="flex items-center">
              <span className="w-28 text-gray-500 dark:text-gray-400">TTL:</span>
              <span className="font-semibold text-gray-800 dark:text-gray-100">{formatTtl(Number(service.ttl))}</span>
            </div>
            <div className="flex items-center">
              <span className="w-28 text-gray-500 dark:text-gray-400">Owner:</span>
              <span className="font-mono text-xs text-gray-400">{formatId(service.owner)}</span>
            </div>
            <div className="flex items-center">
              <span className="w-28 text-gray-500 dark:text-gray-400">Creator ID:</span>
              <span className="font-mono text-xs text-gray-400">{formatId(service.creator_id)}</span>
            </div>
          </div>
          <Dialog open={showSubscribeModal} onOpenChange={setShowSubscribeModal}>
            <DialogContent>
              <DialogTitle>Confirm Subscription</DialogTitle>
              <div>Subscribe to this service for {Number(service.fee) / 1_000_000_000} SUI?</div>
              {coinError && <div className="text-red-500 text-sm">{coinError}</div>}
              <Button onClick={handleSubscribe} disabled={subscribing} className="mt-2">
                {subscribing ? 'Subscribing...' : 'Confirm'}
              </Button>
            </DialogContent>
          </Dialog>
        </div>
      ) : (isSelf && creatorObjId) ? (
        <>
          <Button onClick={() => setShowModal(true)}>Create Service</Button>
          <Dialog open={showModal} onOpenChange={setShowModal}>
            <DialogContent>
              <DialogTitle>Create Service</DialogTitle>
              <div className="flex flex-col gap-2 mt-2">
                <input
                  className="border rounded px-2 py-1"
                  value={fee}
                  onChange={e => setFee(e.target.value)}
                  placeholder="Fee (SUI)"
                  type="number"
                  min={0}
                />
                <div className="flex gap-2 items-center">
                  <input
                    className="border rounded px-2 py-1 w-24"
                    value={ttlValue}
                    onChange={e => setTtlValue(e.target.value)}
                    placeholder="Duration"
                    type="number"
                    min={1}
                  />
                  <select
                    className="border rounded px-2 py-1"
                    value={ttlUnit}
                    onChange={e => setTtlUnit(e.target.value as TtlUnit)}
                  >
                    <option value="day">Day(s)</option>
                    <option value="month">Month(s)</option>
                    <option value="year">Year(s)</option>
                  </select>
                </div>
                {error && <div className="text-red-500 text-sm">{error}</div>}
                <Button
                  onClick={handleCreateService}
                  disabled={creating}
                  className="mt-2"
                >
                  {creating ? 'Creating...' : 'Create'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </>
      ) : (
        <div>No creator object found. Please create a creator profile first.</div>
      )}
    </div>
  );
} 
