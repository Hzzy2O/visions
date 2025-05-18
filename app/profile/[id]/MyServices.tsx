import { useEffect, useState } from 'react';
import ContentCard from '@/components/content-card';
import { network, networkConfig, suiClient } from '@/contracts';

const packageId = networkConfig[network].variables.package;

export default function MyServices({ creatorAddr }: { creatorAddr: string }) {
  const [contents, setContents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchContents = async () => {
      setLoading(true);
      setContents([]);
      if (!creatorAddr) {
        setLoading(false);
        return;
      }
      try {
        // 查询 Content 对象，过滤 creator_id
        const objects = await suiClient.getOwnedObjects({
          owner: creatorAddr,
          filter: { StructType: `${packageId}::content::Content` },
          options: { showContent: true },
        });
        const list = (objects.data || []).map((obj: any) => {
          const content = obj.data?.content?.fields;
          if (!content) return null;
          if (content.creator_id !== creatorAddr) return null;
          return {
            id: obj.data?.objectId,
            title: content.title,
            description: content.description ?? '',
            walrusReference: content.walrus_reference,
            contentType: content.content_type,
            createdAt: content.created_at,
            creatorAddr: content.creator_id,
          };
        }).filter(Boolean);
        setContents(list);
      } catch (e) {
        setContents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchContents();
  }, [creatorAddr]);

  return (
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-4">My Services</h2>
      {loading ? (
        <div className="py-8 text-center text-muted-foreground">Loading contents...</div>
      ) : contents.length === 0 ? (
        <div className="py-8 text-center text-muted-foreground">No content found.</div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {contents.map((content) => (
            <div key={content.id} className="group relative">
              <ContentCard {...content} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
} 
