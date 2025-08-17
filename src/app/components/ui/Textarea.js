// Textarea.js
export default function Textarea({ className = "", ...props }) {
  return (
    <textarea
      data-force-dark
      className={[
        "w-full min-h-[160px] rounded-2xl p-3 text-xs sm:text-lg",
        "border focus:outline-none focus:ring-2",
        "!bg-black !text-white placeholder:!text-neutral-400 !border-neutral-700 !focus:ring-neutral-600",
        "mt-6", // 👈 pushes it down ~3rem (~4.8 cm on typical screens)
        className,
      ].join(" ")}
      {...props}
    />
  );
}
