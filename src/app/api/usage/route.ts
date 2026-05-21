import { NextRequest, NextResponse } from "next/server";
import { getClientIp, getUsage } from "@/lib/rateLimit";

export async function GET(req: NextRequest) {
  const ip = getClientIp(req.headers);
  const usage = getUsage(ip);
  return NextResponse.json(usage);
}
