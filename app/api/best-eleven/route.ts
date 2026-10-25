import { NextResponse } from "next/server";
import { fetchBestEleven } from "@/lib/db";

export async function GET() {
  try {
    return NextResponse.json({ rows: await fetchBestEleven() });
  } catch (error) {
    return NextResponse.json({ error: `Database error: ${(error as Error).message}` }, { status: 500 });
  }
}
