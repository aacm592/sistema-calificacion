import React from 'react';
import Link from 'next/link';

export const Navbar = () => {
  return (
    <nav className="w-full bg-[#0e2043] py-4 px-6 shadow-md">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <Link href="/" className="text-white text-xl font-bold tracking-wide hover:opacity-90 transition-opacity">
          Sistema de Puntuación Musical
        </Link>
      </div>
    </nav>
  );
};
