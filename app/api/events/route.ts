import { NextResponse } from "next/server";
import { cacheGet, cacheSet, buildCacheKey } from "@/lib/cache";

const CATEGORIES = ["Music", "Sports", "Arts & Theatre", "Film", "Miscellaneous"];

interface TicketmasterVenue {
  name?: string;
  city?: { name?: string };
  state?: { name?: string };
  country?: { name?: string };
}

interface TicketmasterDate {
  start?: { localDate?: string; localTime?: string };
  status?: { code?: string };
}

interface TicketmasterClassification {
  segment?: { name?: string };
  genre?: { name?: string };
}

interface TicketmasterEvent {
  id?: string;
  name?: string;
  url?: string;
  _embedded?: { venues?: TicketmasterVenue[] };
  dates?: TicketmasterDate;
  classifications?: TicketmasterClassification[];
}

export async function GET(request: Request) {
  const apiKey = process.env.TICKETMASTER_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      { error: "Events feed is not configured. Please contact the administrator." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const keyword = searchParams.get("keyword") ?? "";
  const location = searchParams.get("location") ?? "";
  const category = searchParams.get("category") ?? "";

  const cacheKey = buildCacheKey({ keyword, location, category });
  const cached = cacheGet<{ results: unknown[]; source: string }>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  const params = new URLSearchParams({
    apikey: apiKey,
    size: "20",
    sort: "date,asc",
  });

  if (keyword) params.set("keyword", keyword);
  if (location) params.set("city", location);
  if (category) params.set("classificationName", category);

  const url = `https://app.ticketmaster.com/discovery/v2/events.json?${params.toString()}`;
  console.log("[Events API] Ticketmaster URL:", url.replace(apiKey, "REDACTED"));

  let raw: { _embedded?: { events?: TicketmasterEvent[] } };
  try {
    const res = await fetch(url);
    if (res.status === 429) {
      return NextResponse.json(
        { error: "Too many requests — Ticketmaster rate limit hit. Please try again shortly." },
        { status: 429 }
      );
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("Ticketmaster responded with status", res.status, body);
      return NextResponse.json(
        { error: "Upstream events service returned an error. Please try again later." },
        { status: 502 }
      );
    }
    raw = await res.json();
  } catch (err) {
    console.error("Ticketmaster network error:", err);
    return NextResponse.json(
      { error: "Could not reach the events feed. Please check your connection." },
      { status: 502 }
    );
  }

  const events = raw._embedded?.events ?? [];

  const results = events.map((e: TicketmasterEvent) => {
    const venue = e._embedded?.venues?.[0];
    const venueName = venue?.name ?? "";
    const city = venue?.city?.name ?? "";
    const state = venue?.state?.name ?? "";
    const country = venue?.country?.name ?? "";
    const locationParts = [venueName, city, state, country].filter(Boolean);
    const locationStr = locationParts.join(", ");

    const startDate = e.dates?.start?.localDate ?? "";
    const startTime = e.dates?.start?.localTime ?? "";
    const dateTimeStr = startTime
      ? `${startDate} ${startTime}`
      : startDate;

    const segment = e.classifications?.[0]?.segment?.name ?? "Miscellaneous";

    return {
      id: e.id ?? "",
      name: e.name ?? "Untitled Event",
      venue: locationStr,
      date: dateTimeStr,
      category: segment,
      redirectUrl: e.url ?? "",
    };
  });

  const payload = { results, source: "api" as const };
  cacheSet(cacheKey, payload);

  return NextResponse.json(payload);
}
