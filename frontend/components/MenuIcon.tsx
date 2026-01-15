interface MenuIconProps {
  onClick: () => void;
  isOpen?: boolean;
}

export default function MenuIcon({ onClick, isOpen = false }: MenuIconProps) {
  return (
    <button
      onClick={onClick}
      className="fixed top-4 right-4 z-[101] p-2 bg-green-600 text-white rounded-lg shadow-lg hover:bg-green-700 transition-colors"
      aria-label="תפריט"
    >
      {isOpen ? (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
        </svg>
      )}
    </button>
  );
}

