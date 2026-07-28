import GlassCard from "@/components/ui/GlassCard";

type ProfileCardProps = {
  email: string;
  avatarBase64?: string;
  degree?: string;
  branch?: string;
  cgpa?: number;
  careerPath?: string;
};

export default function ProfileCard({
  email,
  avatarBase64,
  degree,
  branch,
  cgpa,
  careerPath,
}: ProfileCardProps) {
  const initial = email ? email.charAt(0).toUpperCase() : "?";

  return (
    <GlassCard className="p-5 flex items-center gap-5 min-h-[180px] text-left">
      <div className="min-w-0 flex-1">
        <h3 className="text-xl font-semibold mb-3 text-on-surface dark:text-on-surface font-display">
          Profile Summary
        </h3>
        <ul className="space-y-1.5 text-on-surface-variant dark:text-on-surface-variant font-body">
          {degree && (
            <li>
              <span className="font-medium text-on-surface-variant/70 dark:text-on-surface-variant/70">Degree:</span>{" "}
              {degree}
            </li>
          )}
          {branch && (
            <li>
              <span className="font-medium text-on-surface-variant/70 dark:text-on-surface-variant/70">Branch:</span>{" "}
              {branch}
            </li>
          )}
          {cgpa !== undefined && (
            <li>
              <span className="font-medium text-on-surface-variant/70 dark:text-on-surface-variant/70">CGPA:</span>{" "}
              {cgpa}
            </li>
          )}
          {careerPath && (
            <li>
              <span className="font-medium text-on-surface-variant/70 dark:text-on-surface-variant/70">
                Career Path:
              </span>{" "}
              {careerPath}
            </li>
          )}
        </ul>
      </div>

      <div className="shrink-0">
        {avatarBase64 ? (
          <img
            src={avatarBase64}
            alt="Profile Avatar"
            className="w-[108px] h-[108px] rounded-full object-cover border-2 border-outline-variant/40 dark:border-outline-variant/30 shadow-sm"
          />
        ) : (
          <div className="w-[108px] h-[108px] rounded-full bg-accent-teal flex items-center justify-center text-white text-4xl font-bold border-2 border-accent-teal/70 shadow-sm">
            {initial}
          </div>
        )}
      </div>
    </GlassCard>
  );
}
