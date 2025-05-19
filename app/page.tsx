"use client";

import { useRef, useEffect, useState, Suspense, lazy, RefObject } from "react";
import Image from "next/image";
import Link from "next/link";
import dynamic from "next/dynamic";
import ContentFilter, {
  type FilterType,
  type SortType,
} from "@/components/content-filter";
import { suiClient, networkConfig, network } from "@/contracts";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useGSAPAnimation, useStaggerAnimation, useParallaxEffect } from "@/hooks/use-gsap";
import SectionDivider from "@/components/section-divider";
import ContentCardSkeleton from "@/components/content-card-skeleton";

// Dynamically import the ContentCard component
const ContentCard = dynamic(() => import("@/components/content-card"), {
  loading: () => <ContentCardSkeleton />,
  ssr: false
});

export default function Home() {
  const [activeFilter, setActiveFilter] = useState<FilterType>("all");
  const [activeSort, setActiveSort] = useState<SortType>("latest");
  const [contents, setContents] = useState<any[]>([]); // 链上内容数据
  const [filteredContents, setFilteredContents] = useState<any[]>([]);
  const [isContentVisible, setIsContentVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // 新增 loading 状态
  const router = useRouter();

  const heroSectionRef = useRef<HTMLDivElement>(null);
  const contentSectionRef = useRef<HTMLDivElement>(null);
  const contentGridRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  // 获取 packageId
  const packageId = networkConfig[network].variables.package;

  // 拉取链上内容数据
  useEffect(() => {
    async function fetchContents() {
      setIsLoading(true); // 开始加载
      try {
        // 1. 查询所有 ContentCreatedEvent 事件
        const eventResp = await suiClient.queryEvents({
          query: { MoveEventType: `${packageId}::content::ContentCreatedEvent` },
          limit: 100,
        });
        const events = eventResp.data || [];
        // 2. 批量获取内容对象详情
        const contentIds = events.map((e: any) => e.parsedJson?.content_id).filter(Boolean);
        const contentObjs = await Promise.all(
          contentIds.map(async (id: string) => {
            try {
              const obj = await suiClient.getObject({
                id,
                options: { showContent: true },
              });
              return obj;
            } catch {
              return null;
            }
          })
        );
        // 3. 组装内容数据
        const items = contentObjs.map((obj: any, idx: number) => {
          if (!obj || !obj.data) return null;
          const fields = obj.data.content?.fields || obj.data.fields;
          const event = events[idx]?.parsedJson as any || {};
          return {
            id: obj.data.objectId,
            type: event.content_type === "image" ? "image" : "article",
            title: event.title || fields?.title || "",
            description: fields?.description?.fields?.some || fields?.description || "",
            creatorId: event.creator_id || fields?.creator_id || "",
            creatorAddr: fields?.creator_addr || "",
            createdAt: fields?.created_at ? new Date(Number(fields.created_at) * 1000).toISOString() : "",
            walrusReference: fields?.walrus_reference || "",
            previewReference: fields?.preview_reference || "",
          };
        }).filter(Boolean);
        setContents(items);
      } catch (e) {
        setContents([]);
      }
      setIsLoading(false); // 加载结束
    }
    fetchContents();
  }, [packageId]);

  // 筛选与排序
  useEffect(() => {
    let result = [...contents];
    if (activeFilter !== "all") {
      result = result.filter((content) => content.type === activeFilter);
    }
    switch (activeSort) {
      case "latest":
        result = result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case "oldest":
        result = result.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
        break;
      case "popular":
        // 如有 likes 字段可加排序
        break;
    }
    setFilteredContents(result);
  }, [activeFilter, activeSort, contents]);

  // Apply GSAP animations
  const gsapCtx = useGSAPAnimation();

  // Use GSAP for section animations
  useEffect(() => {
    if (!contentSectionRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsContentVisible(true);
          }
        });
      },
      { threshold: 0.1 }
    );

    observer.observe(contentSectionRef.current);
    return () => {
      if (contentSectionRef.current) {
        observer.unobserve(contentSectionRef.current);
      }
    };
  }, []);

  // Use staggered animation for content cards
  useStaggerAnimation(contentGridRef as unknown as RefObject<HTMLElement>, ".content-card-wrapper", {
    staggerAmount: 0.1,
    animation: {
      fromVars: { opacity: 0, y: 50, scale: 0.9 },
      toVars: { opacity: 1, y: 0, scale: 1, duration: 0.8, ease: "power3.out" }
    },
    scrollTrigger: {
      start: "top bottom-=100",
      end: "bottom center",
    }
  });

  // Apply parallax effect to title
  useParallaxEffect(titleRef as unknown as RefObject<HTMLElement>, {
    speed: 0.3,
    direction: "up",
  });

  return (
    <div className="container py-8 md:py-12">
      {/* Hero Section */}
      <section 
        ref={heroSectionRef} 
        className="mb-16 rounded-3xl bg-lime p-8 md:p-12 overflow-hidden"
      >
        <div className="grid gap-8 md:grid-cols-2 md:items-center">
          <div className="animate-fade-in">
            <h1 className="hero-title">SHARE YOUR VISIONS</h1>
            <p className="mt-4 text-xl">
              Showcase your creative work on this platform, connecting with
              creators and enthusiasts worldwide
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link href="/creator/setup">
                <div className="rounded-full bg-white/80 px-4 py-2 font-medium hover:bg-white transition-colors">
                  Become Creator
                </div>
              </Link>
            </div>
          </div>
          <div className="relative h-64 md:h-80 animate-fade-in-delayed">
            <div className="absolute -bottom-4 -right-4 h-full w-3/4 rounded-3xl bg-blue"></div>
            <div className="absolute -left-4 -top-4 h-full w-3/4 rounded-3xl bg-white"></div>
            <Image
              src="/poster.png"
              alt="Creative Digital Art"
              fill
              className="rounded-3xl object-cover"
            />
          </div>
        </div>
      </section>

      {/* Section Divider */}
      <SectionDivider />

      {/* Content Section with Filters */}
      <section className="mb-16 relative" ref={contentSectionRef}>
        <h2 ref={titleRef} className="section-title mb-8 inline-block bg-gradient-to-r from-blue to-lime bg-clip-text text-transparent">
          Explore Content
        </h2>

        <ContentFilter
          activeFilter={activeFilter}
          onFilterChange={setActiveFilter}
          activeSort={activeSort}
          onSortChange={setActiveSort}
        />

        <AnimatePresence mode="wait">
          <motion.div
            key={activeFilter + activeSort + (isLoading ? "-loading" : "-loaded")}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.3 }}
            ref={contentGridRef}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-8 content-grid"
          >
            {isLoading ? (
              // 加载中显示骨架屏
              Array.from({ length: 6 }).map((_, idx) => (
                <ContentCardSkeleton key={idx} />
              ))
            ) : filteredContents.length > 0 ? (
              <>
                {filteredContents.map((content, index) => (
                  <motion.div
                    key={content.id}
                    className="content-card-wrapper"
                    style={{
                      transformOrigin: "center",
                      transformStyle: "preserve-3d",
                      willChange: "transform, opacity"
                    }}
                  >
                    <Suspense fallback={<ContentCardSkeleton />}>
                      <ContentCard {...content} />
                    </Suspense>
                  </motion.div>
                ))}
              </>
            ) : (
              <div className="col-span-full py-12 text-center">
                <p className="text-lg text-muted-foreground">
                  No content found matching your filters.
                </p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </section>
    </div>
  );
}
