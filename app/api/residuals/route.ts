import { NextResponse } from "next/server";
import { fetchResiduals } from "@/lib/db";

export async function GET() {
  try {
    return NextResponse.json({ rows: await fetchResiduals() });
  } catch (error) {
    return NextResponse.json({ error: `Database error: ${(error as Error).message}` }, { status: 500 });
  }
}