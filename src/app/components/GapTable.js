import { Badge } from "./ui/Badge";

export default function GapTable({ present = [], missing = [], weak = [], onSelectSkill = () => {} }) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Column title="Present" items={present} tone="good" onClickItem={onSelectSkill} />
      <Column title="Missing (ranked)" items={missing.map((m) => m.skill)} tone="bad" onClickItem={onSelectSkill} />
      <Column title="Weak" items={weak} tone="warn" onClickItem={onSelectSkill} />
    </div>
  );
}

function Column({ title, items, tone, onClickItem }) {
  return (
    <div className="rounded-xl border border-neutral-700 bg-black p-3 text-white">
      <div className="text-xs sm:text-lg font-medium mb-2">{title}</div>

      <div className="flex flex-wrap gap-3">
        {items.length === 0 ? (
          <span className="text-xs sm:text-lg text-neutral-400">—</span>
        ) : (
          items.map((s, i) => (
            <button
              key={i}
              onClick={() => onClickItem(s)}
              className="focus:outline-none focus-visible:ring-2 focus-visible:ring-neutral-600 rounded-lg"
            >
              <Badge
                tone={tone}
                className="text-sm sm:text-2xl px-4 py-2" // ⬅️ bigger font + padding
              >
                {s}
              </Badge>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
