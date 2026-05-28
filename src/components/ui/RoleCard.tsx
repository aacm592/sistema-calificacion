import Link from 'next/link';
import Image from 'next/image';

interface RoleCardProps {
  title: string;
  iconPath: string;
  href: string;
  buttonColor: string;
}

export const RoleCard = ({ title, iconPath, href, buttonColor }: RoleCardProps) => {
  return (
    <div className="flex flex-col items-center bg-white rounded-2xl shadow-xl p-8 w-full max-w-[280px] border border-gray-100 transition-transform hover:scale-105">
      
      {/* Contenedor del ícono */}
      <div className="relative w-32 h-32 mb-8">
        <Image
          src={iconPath}
          alt={`Ícono para ${title}`}
          fill
          className="object-contain"
        />
      </div>
      
      {/* Botón de enlace manejado por Next.js */}
      <Link 
        href={href}
        className={`w-full py-3 px-4 rounded-xl text-white font-bold text-center transition-colors shadow-md ${buttonColor}`}
      >
        {title}
      </Link>
      
    </div>
  );
};