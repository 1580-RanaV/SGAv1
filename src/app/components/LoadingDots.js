export default function LoadingDots() {
  return (
    <span className="inline-flex gap-1">
      <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:-0.2s]" />
      <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce" />
      <span className="w-1.5 h-1.5 rounded-full bg-neutral-500 animate-bounce [animation-delay:0.2s]" />
    </span>
  );
}
