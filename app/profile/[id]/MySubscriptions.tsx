import { useEffect, useState } from 'react';
import { network, networkConfig, suiClient } from '@/contracts';
import { FaRegSadTear } from 'react-icons/fa';
import Link from 'next/link';

const packageId = networkConfig[network].variables.package;

// 地址缩略显示
function shortAddr(addr: string) {
  if (!addr) return '';
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}
// 格式化时间
function formatTime(ts: string) {
  if (!ts) return '-';
  const d = new Date(Number(ts));
  return d.toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
}
// Sui Explorer 地址
function explorerUrl(addr: string) {
  return `https://suiexplorer.com/address/${addr}?network=mainnet`;
}

export default function MySubscriptions({ accountAddr }: { accountAddr: string }) {
  const [subs, setSubs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [creatorNames, setCreatorNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!accountAddr) return;
    setLoading(true);
    suiClient.queryEvents({
      query: {
        MoveEventType: `${packageId}::subscription::SubscriptionCreatedEvent`
      },
      limit: 100,
    }).then(async (res: any) => {
      // 只取当前用户的订阅
      const list = (res.data || []).filter((evt: any) => {
        const fields = evt.parsedJson;
        return fields && fields.subscriber_addr === accountAddr;
      }).map((evt: any) => {
        const fields = evt.parsedJson;
        return {
          subscription_id: fields.subscription_id,
          creator_addr: fields.creator_addr,
          service_id: fields.service_id,
          start_time: fields.start_time,
          end_time: fields.end_time,
          payment_amount: fields.payment_amount,
        };
      });
      setSubs(list);
      // 批量查 creator name
      const addrs = Array.from(new Set(list.map((s: any) => s.creator_addr)));
      if (addrs.length > 0) {
        const results = (await Promise.all(
          (addrs as string[]).map(async (addr): Promise<[string, string]> => {
            try {
              const objs = await suiClient.getOwnedObjects({
                owner: addr,
                filter: { StructType: `${packageId}::creator::Creator` },
                options: { showContent: true },
              });
              const obj = (objs.data || [])[0];
              const name = (obj?.data?.content as any)?.fields?.name;
              return [addr, typeof name === 'string' ? name : ''];
            } catch {
              return [addr, ''];
            }
          })
        )) as [string, string][];
        const nameMap: Record<string, string> = {};
        results.forEach(([addr, name]) => {
          if (name) nameMap[addr] = name;
        });
        setCreatorNames(nameMap);
      }
    }).finally(() => setLoading(false));
  }, [accountAddr]);

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <span>My Subscriptions</span>
        <span className="text-blue-500 text-base font-normal">({subs.length})</span>
      </h2>
      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Loading...</div>
      ) : subs.length === 0 ? (
        <div className="py-12 flex flex-col items-center text-gray-400">
          <FaRegSadTear className="text-4xl mb-2" />
          <div>No subscriptions found.</div>
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-separate border-spacing-y-2 bg-white dark:bg-gray-900 rounded-xl shadow-md">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                <th className="px-4 py-3 text-left font-semibold rounded-tl-xl">Creator</th>
                <th className="px-4 py-3 text-left font-semibold">Service</th>
                <th className="px-4 py-3 text-left font-semibold">Start</th>
                <th className="px-4 py-3 text-left font-semibold">End</th>
                <th className="px-4 py-3 text-left font-semibold rounded-tr-xl">Paid</th>
              </tr>
            </thead>
            <tbody>
              {subs.map(sub => (
                <tr key={sub.subscription_id} className="hover:bg-blue-50 dark:hover:bg-gray-800 transition">
                  <td className="px-4 py-2 font-mono break-all">
                    <Link
                      href={`/profile/${sub.creator_addr}`}
                      className="text-blue-600 hover:underline font-sans"
                      title={sub.creator_addr}
                    >
                      {creatorNames[sub.creator_addr] ? creatorNames[sub.creator_addr] : shortAddr(sub.creator_addr)}
                    </Link>
                  </td>
                  <td className="px-4 py-2 font-mono text-xs break-all">
                    <a
                      href={explorerUrl(sub.service_id)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                      title={sub.service_id}
                    >
                      {shortAddr(sub.service_id)}
                    </a>
                  </td>
                  <td className="px-4 py-2">{formatTime(sub.start_time)}</td>
                  <td className="px-4 py-2">{formatTime(sub.end_time)}</td>
                  <td className="px-4 py-2 font-semibold text-blue-500">{Number(sub.payment_amount) / 1_000_000_000} SUI</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
} 
