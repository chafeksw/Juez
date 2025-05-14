export function Select({ children }) {
  return <div>{children}</div>;
}
export function SelectTrigger({ children }) {
  return <div className="border p-2 rounded">{children}</div>;
}
export function SelectValue({ placeholder }) {
  return <span>{placeholder}</span>;
}
export function SelectContent({ children }) {
  return <div>{children}</div>;
}
export function SelectItem({ value, children }) {
  return <div data-value={value}>{children}</div>;
}
