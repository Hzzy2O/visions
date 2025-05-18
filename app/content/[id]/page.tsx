"use client"

import dynamic from "next/dynamic"
import { Suspense } from "react"

// 骨架屏组件
function ContentSkeleton() {
  return (
    <div className="container py-8 md:py-12">
      <div className="grid gap-8 md:grid-cols-2">
        {/* Skeleton for Content Display */}
        <div>
          <div className="skeleton h-[400px] w-full rounded-2xl mb-8"></div>
        </div>
        {/* Skeleton for Content Info */}
        <div>
          <div className="mb-4 flex items-center gap-2">
            <div className="skeleton h-5 w-5 rounded-full" />
            <div className="skeleton h-6 w-24 rounded-full" />
          </div>
          <div className="skeleton h-8 w-64 mb-4 rounded" />
          <div className="flex items-center gap-4 mb-4">
            <div className="skeleton h-6 w-16 rounded-full" />
            <div className="skeleton h-4 w-40 rounded" />
          </div>
          <div className="skeleton h-4 w-full max-w-xl mb-2 rounded" />
          <div className="skeleton h-4 w-3/4 mb-2 rounded" />
          <div className="skeleton h-4 w-1/2 mb-2 rounded" />
        </div>
      </div>
    </div>
  );
}

// 动态导入内容详情组件
const ContentDetail = dynamic(() => import("./ContentDetail"), {
  loading: () => <ContentSkeleton />,
  ssr: false,
});

export default function Page() {
  return (
    <Suspense fallback={<ContentSkeleton />}>
      <ContentDetail />
    </Suspense>
  );
}
