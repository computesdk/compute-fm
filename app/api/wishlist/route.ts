import { NextResponse } from "next/server";
import { getStore } from "@/lib/requests/store";

export const dynamic = "force-dynamic";

// Public read of the should-purchase list, so the site can surface what
// listeners want that isn't in the library yet.
export async function GET() {
  try {
    const items = await getStore().listWishlist();
    return NextResponse.json(
      { items },
      {
        headers: {
          "Cache-Control": "no-store, max-age=0",
          "Access-Control-Allow-Origin": "*",
        },
      }
    );
  } catch {
    return NextResponse.json(
      { error: "Failed to load wishlist" },
      { status: 502 }
    );
  }
}
