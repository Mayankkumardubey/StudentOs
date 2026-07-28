import { ExternalLink, Bookmark, BookmarkCheck } from "lucide-react";

export interface Opportunity {
  id: string;
  title: string;
  company: string;
  location: string;
  mode: "Remote" | "Hybrid" | "Onsite";
  salary: string;
  postedDate: string;
  redirectUrl: string;
}

const modeColors: Record<Opportunity["mode"], string> = {
  Remote: "bg-emerald-900/60 text-emerald-300 border-emerald-700",
  Hybrid: "bg-amber-900/60 text-amber-300 border-amber-700",
  Onsite: "bg-sky-900/60 text-sky-300 border-sky-700",
};

interface OpportunityCardProps {
  job: Opportunity;
  bookmarked?: boolean;
  onToggleBookmark?: (job: Opportunity) => void;
  onDelete?: () => void;
}

export default function OpportunityCard({ job, bookmarked, onToggleBookmark, onDelete }: OpportunityCardProps) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-5 hover:border-gray-300 dark:hover:border-gray-700 transition">
      <div>
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-semibold text-gray-900 dark:text-gray-100 leading-snug">{job.title}</h3>
          {onToggleBookmark && (
            <button
              onClick={() => onToggleBookmark(job)}
              className="shrink-0 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
              title={bookmarked ? "Remove bookmark" : "Bookmark"}
            >
              {bookmarked ? (
                <BookmarkCheck size={18} className="text-indigo-400" />
              ) : (
                <Bookmark size={18} className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300" />
              )}
            </button>
          )}
        </div>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{job.company}</p>

        <div className="mt-3 flex flex-wrap gap-2">
          <span
            className={`inline-block rounded-full border px-2.5 py-0.5 text-xs font-medium ${modeColors[job.mode]}`}
          >
            {job.mode}
          </span>
          <span className="inline-block rounded-full border border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800 px-2.5 py-0.5 text-xs text-gray-700 dark:text-gray-300">
            {job.location}
          </span>
        </div>

        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300">{job.salary}</p>
      </div>

      <div className="mt-4 flex items-center justify-between text-xs text-gray-400 dark:text-gray-500">
        <span>{job.postedDate}</span>
        <div className="flex items-center gap-2">
          {onDelete && (
            <button
              onClick={() => onDelete()}
              className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400 dark:text-gray-500 hover:text-red-400 transition"
              title="Remove"
            >
              ✕
            </button>
          )}
          <a
            href={job.redirectUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-indigo-400 hover:text-indigo-300 transition"
          >
            View listing <ExternalLink size={13} />
          </a>
        </div>
      </div>
    </div>
  );
}
