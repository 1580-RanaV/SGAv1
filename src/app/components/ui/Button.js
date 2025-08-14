export default function Button({ className="", variant="primary", ...props }) {
  const base = "btn";
  const variants = {
    primary: "btn-primary",
    ghost: "btn-ghost",
    outline: "btn-outline",
  };
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}
