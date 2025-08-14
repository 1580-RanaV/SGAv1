import { Badge } from "./ui/Badge";

export default function GapTable({ present=[], missing=[], weak=[], onSelectSkill=()=>{} }) {
  return (
    <div className="grid md:grid-cols-3 gap-4">
      <Column title="Present" items={present} tone="good" onClickItem={onSelectSkill} />
      <Column title="Missing (ranked)" items={missing.map(m=>m.skill)} tone="bad" onClickItem={onSelectSkill} />
      <Column title="Weak" items={weak} tone="warn" onClickItem={onSelectSkill} />
    </div>
  );
}

function Column({ title, items, tone, onClickItem }) {
  return (
    <div className="card p-3">
      <div className="text-sm font-medium mb-2">{title}</div>
      <div className="flex flex-wrap gap-2">
        {items.length === 0 ? <span className="text-sm text-neutral-500">—</span> :
          items.map((s, i)=> (
            <button key={i} onClick={()=>onClickItem(s)} className="focus:outline-none">
              <Badge tone={tone}>{s}</Badge>
            </button>
          ))
        }
      </div>
    </div>
  );
}
