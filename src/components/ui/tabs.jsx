export function Tabs({ children }) {
  return <div>{children}</div>;
}
export function TabsList({ children }) {
  return <div className="flex space-x-2">{children}</div>;
}
export function TabsTrigger({ value, children, onClick }) {
  return <button onClick={() => onClick(value)} className="px-2 py-1 border rounded">{children}</button>;
}
export function TabsContent({ value, children }) {
  return <div>{children}</div>;
}
