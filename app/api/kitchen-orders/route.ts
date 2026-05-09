export const runtime = "nodejs";

import { NextResponse } from "next/server";

import { requireInternalMenuAccess } from "@/lib/server/internal-guards";
import { getKitchenBoardData } from "@/lib/supabase/data";

export async function GET() {
  const auth = await requireInternalMenuAccess("dapur", "read");

  if (auth.error) {
    return auth.error;
  }

  const orders = await getKitchenBoardData();

  return NextResponse.json(orders);
}
