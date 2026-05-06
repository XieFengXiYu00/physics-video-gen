import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    // Note: Server-side video rendering with Remotion requires @remotion/renderer
    // which needs ffmpeg and is heavy for serverless. For now, we return a helpful message.
    // In production, you'd use Remotion Lambda or a dedicated render server.
    
    return NextResponse.json(
      {
        error:
          "视频渲染功能需要服务端配置。请在本地运行 `npx remotion render` 或使用 Remotion Lambda 服务。",
      },
      { status: 501 }
    );
  } catch (err) {
    console.error("[/api/render]", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "渲染失败" },
      { status: 500 }
    );
  }
}
