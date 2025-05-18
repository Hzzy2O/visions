// app/api/upload-walrus/route.ts
import { NextRequest, NextResponse } from "next/server";

const DEFAULT_PUBLISHER_URL = "https://publisher.walrus-testnet.walrus.space/v1";

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";
    // 1. application/json 走原有加密逻辑
    if (contentType.includes("application/json")) {
      const { encryptedData, numEpochs, send_object_to } = await req.json();
      if (!encryptedData || !numEpochs) {
        return NextResponse.json({ error: "Missing params" }, { status: 400 });
      }
      const data = Uint8Array.from(encryptedData);
      let url = `${DEFAULT_PUBLISHER_URL}/blobs?epochs=${numEpochs}`;
      if (send_object_to && typeof send_object_to === "string" && send_object_to.trim() !== "") {
        url += `&send_object_to=${encodeURIComponent(send_object_to)}`;
      }
      const walrusRes = await fetch(url, {
        method: "PUT",
        body: data,
      });
      if (walrusRes.status === 200) {
        const info = await walrusRes.json();
        return NextResponse.json({ info });
      } else {
        const text = await walrusRes.text();
        return NextResponse.json({ error: text }, { status: walrusRes.status });
      }
    } else {
      // 2. 其他类型（如 image/jpeg、image/png）直接转发 body 到 Walrus
      // 取参数
      const numEpochs = req.nextUrl.searchParams.get("epochs") || "1";
      const send_object_to = req.nextUrl.searchParams.get("send_object_to") || "";
      let url = `${DEFAULT_PUBLISHER_URL}/blobs?epochs=${numEpochs}`;
      if (send_object_to) {
        url += `&send_object_to=${encodeURIComponent(send_object_to)}`;
      }
      const walrusRes = await fetch(url, {
        method: "PUT",
        body: req.body,
        headers: {
          "content-type": contentType
        },
        duplex: "half"
      } as any);
      if (walrusRes.status === 200) {
        const info = await walrusRes.json();
        return NextResponse.json({ info });
      } else {
        const text = await walrusRes.text();
        return NextResponse.json({ error: text }, { status: walrusRes.status });
      }
    }
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Unknown error" }, { status: 500 });
  }
}
