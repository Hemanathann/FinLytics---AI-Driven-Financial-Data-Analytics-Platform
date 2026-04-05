import { seedDemoTransactions } from "@/actions/seed-demo";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const result = await seedDemoTransactions();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}