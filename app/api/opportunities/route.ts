import { NextResponse } from "next/server";
import { cacheGet, cacheSet, buildCacheKey } from "@/lib/cache";

// ── Salary bucket → Adzuna min/max ────────────────────────────────────────────
const SALARY_MAP: Record<string, { min: number; max: number }> = {
  "1L-1.5L": { min: 100000, max: 150000 },
  "1.5L-2L": { min: 150000, max: 200000 },
  "2L-3L": { min: 200000, max: 300000 },
  "3L-5L": { min: 300000, max: 500000 },
  "5L-8L": { min: 500000, max: 800000 },
  "8L-12L": { min: 800000, max: 1200000 },
  "12L+": { min: 1200000, max: 0 }, // 0 = no upper bound
};

// ── Helpers ───────────────────────────────────────────────────────────────────
function formatSalaryLakhs(value: number): string {
  const lakhs = value / 100000;
  if (lakhs === Math.floor(lakhs)) return `₹${lakhs}L`;
  return `₹${lakhs.toFixed(1)}L`;
}

function formatSalary(min?: number | null, max?: number | null): string {
  if (!min && !max) return "Not disclosed";
  const parts: string[] = [];
  if (min) parts.push(formatSalaryLakhs(min));
  if (max) parts.push(formatSalaryLakhs(max));
  if (parts.length === 2) return `${parts[0]} – ${parts[1]}`;
  if (parts.length === 1) return parts[0];
  return "Not disclosed";
}

function detectMode(title: string, description: string, location: string): "Remote" | "Hybrid" | "Onsite" {
  const combined = `${title} ${description} ${location}`.toLowerCase();
  if (/\bremote\b/.test(combined)) return "Remote";
  if (/\bhybrid\b/.test(combined)) return "Hybrid";
  return "Onsite";
}

function isInternship(title: string): boolean {
  return /\b(intern|internship|trainee)\b/i.test(title);
}

// ── GET /api/opportunities ────────────────────────────────────────────────────
export async function GET(request: Request) {
  const appId = process.env.Adzuna_APP_ID ?? process.env.ADZUNA_APP_ID;
  const appKey = process.env.Adzuna_APP_KEY ?? process.env.ADZUNA_APP_KEY;

  if (!appId || !appKey) {
    console.error("Adzuna env vars missing:", { appId: !!appId, appKey: !!appKey, all: Object.keys(process.env).filter(k => k.toLowerCase().includes("adzuna")) });
    return NextResponse.json(
      { error: "Job feed is not configured. Please contact the administrator." },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(request.url);
  const role = searchParams.get("role") ?? "";
  const location = searchParams.get("location") ?? "";
  const modes = searchParams.getAll("mode"); // multi-value
  const salary = searchParams.get("salary") ?? "";
  const type = searchParams.get("type") ?? "";

  // ── Cache lookup ──────────────────────────────────────────────────────────
  const cacheKey = buildCacheKey({ role, location, modes: modes.join(","), salary, type });
  const cached = cacheGet<{ results: unknown[]; source: string }>(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  // ── Build Adzuna request ─────────────────────────────────────────────────
  const params = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: "30",
  });

  if (role) params.set("what", role);
  if (location) params.set("where", location);

  // Salary passthrough to Adzuna
  const salaryBucket = SALARY_MAP[salary];
  if (salaryBucket) {
    params.set("salary_min", String(salaryBucket.min));
    if (salaryBucket.max > 0) {
      params.set("salary_max", String(salaryBucket.max));
    }
  }

  // Full-time passthrough
  if (type === "Full-time") {
    params.set("full_time", "1");
  }

  const url = `https://api.adzuna.com/v1/api/jobs/in/search/1?${params.toString()}`;

  // ── Call Adzuna ──────────────────────────────────────────────────────────
  let raw: { results?: Array<Record<string, unknown>> };
  try {
    const res = await fetch(url);
    if (res.status === 429) {
      return NextResponse.json(
        { error: "Too many requests — Adzuna rate limit hit. Please try again shortly." },
        { status: 429 }
      );
    }
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("Adzuna responded with status", res.status, body);
      return NextResponse.json(
        { error: "Upstream job service returned an error. Please try again later." },
        { status: 502 }
      );
    }
    raw = await res.json();
  } catch (err) {
    console.error("Adzuna network error:", err);
    return NextResponse.json(
      { error: "Could not reach the job feed. Please check your connection." },
      { status: 502 }
    );
  }

  const jobs = raw.results ?? [];

  // ── Format & filter ──────────────────────────────────────────────────────
  interface AdzunaJob {
    id?: string;
    title?: string;
    company?: { display_name?: string };
    location?: { display_name?: string };
    description?: string;
    salary_min?: number | null;
    salary_max?: number | null;
    created?: string;
    redirect_url?: string;
  }

  let results = jobs.map((j: AdzunaJob) => {
    const title = j.title ?? "Untitled";
    const description = j.description ?? "";
    const loc = j.location?.display_name ?? "";
    return {
      id: String(j.id ?? ""),
      title,
      company: j.company?.display_name ?? "Unknown",
      location: loc,
      mode: detectMode(title, description, loc),
      salary: formatSalary(j.salary_min, j.salary_max),
      postedDate: j.created ? new Date(j.created).toLocaleDateString("en-IN") : "",
      redirectUrl: j.redirect_url ?? "",
    };
  });

  // Post-filter: work mode
  if (modes.length > 0) {
    const lowerModes = modes.map((m) => m.toLowerCase());
    results = results.filter((r: { mode: string }) => lowerModes.includes(r.mode.toLowerCase()));
  }

  // Post-filter: internship
  if (type === "Internship") {
    results = results.filter((r: { title: string }) => isInternship(r.title));
  }

  // ── Cache & respond ──────────────────────────────────────────────────────
  const payload = { results, source: "api" as const };
  cacheSet(cacheKey, payload);

  return NextResponse.json(payload);
}
