export function Card({ className="", children }) {
  return <div className={`card ${className}`}>{children}</div>;
}
export function CardHeader({ children, className="" }) {
  return <div className={`px-4 pt-4 ${className}`}>{children}</div>;
}
export function CardContent({ children, className="" }) {
  return <div className={`px-4 pb-4 ${className}`}>{children}</div>;
}
