import Link from "next/link";

interface CommunityCardProps {
  _id: string;
  name: string;
  description: string;
  category: string;
  image: string;
  role: string;
}

export default function CommunityCard({
  _id,
  name,
  description,
  category,
  image,
  role,
}: CommunityCardProps) {
  return (
    <Link
      href={`/communities/${_id}`}
      className="block rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 p-5 hover:border-gray-300 dark:hover:border-gray-700 transition"
    >
      <div className="flex items-start gap-4">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt={name}
            className="w-12 h-12 rounded-lg object-cover flex-none"
          />
        ) : (
          <div className="w-12 h-12 rounded-lg bg-indigo-900/50 border border-indigo-700 flex items-center justify-center text-indigo-400 font-bold text-lg flex-none">
            {name[0]?.toUpperCase()}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{name}</h3>
            {role === "owner" && (
              <span className="text-xs bg-amber-900/50 text-amber-300 border border-amber-700 rounded-full px-2 py-0.5">
                Owner
              </span>
            )}
          </div>
          {description && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">
              {description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2">
            {category && (
              <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-full px-2 py-0.5">
                {category}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
