export interface RangeSummary {
  id: number;
  name: string;
  city: string | null;
  state: string | null;
  logo_url: string | null;
  primary_color_hex: string | null;
}

export function RangeCard({ range }: { range: RangeSummary }) {
  return (
    <div className="bg-card border border-ink/10 p-5">
      <div className="flex items-start gap-4">
        {range.logo_url ? (
          <div className="size-12 shrink-0 rounded overflow-hidden border border-ink/10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={range.logo_url}
              alt={range.name}
              className="object-cover size-full"
            />
          </div>
        ) : (
          <div
            className="size-12 shrink-0 rounded flex items-center justify-center text-white font-bold text-lg"
            style={{ backgroundColor: range.primary_color_hex ?? "#888" }}
          >
            {range.name[0]}
          </div>
        )}
        <div className="min-w-0">
          <h3 className="font-bold text-lg leading-tight truncate">{range.name}</h3>
          {(range.city || range.state) && (
            <p className="mt-1 font-mono text-xs text-ink/50 uppercase tracking-wider">
              {[range.city, range.state].filter(Boolean).join(", ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
