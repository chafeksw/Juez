export function Button({ children, onClick, className = '', variant = 'default', ...props }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
