import { Navbar } from '@/components/layout/Navbar';
import { RoleCard } from '@/components/ui/RoleCard';
import Image from 'next/image';
import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-white flex flex-col">
      <Navbar />

      {/* Contenedor Principal */}
      <div className="flex-grow flex flex-col md:flex-row items-center justify-center px-6 py-8 md:px-8 md:py-12 gap-10 md:gap-16 max-w-6xl mx-auto w-full">
        
        {/* Sección Izquierda/Superior: Ilustración y Bienvenida */}
        <section className="flex flex-col items-center flex-1 w-full">
          {/* El contenedor de la imagen se ajusta dinámicamente */}
          <div className="relative w-full max-w-[260px] sm:max-w-xs md:max-w-md aspect-square">
            <Image
              src="/images/hero-illustration.svg"
              alt="Ilustración de instrumentos musicales"
              fill
              className="object-contain"
              priority
            />
          </div>
          <h2 className="text-[#0e2043] text-4xl md:text-5xl font-extrabold mt-2 md:mt-6 tracking-tight text-center">
            ¡Bienvenido!
          </h2>
        </section>

        {/* Sección Derecha/Inferior: Selección de Roles y Demostración */}
        <section className="flex flex-col items-center justify-center gap-6 flex-1 w-full">
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6 w-full">
            <RoleCard
              title="Soy administrador"
              iconPath="/images/admin-icon.svg"
              href="/admin"
              buttonColor="bg-[#223164] hover:bg-[#0e2043]"
            />
            
            <RoleCard
              title="Soy jurado"
              iconPath="/images/jury-icon.svg"
              href="/jurado/ingreso"
              buttonColor="bg-[#e8af2e] hover:bg-[#d49f25]"
            />
          </div>

          {/* Acceso a Modo Demostración */}
          <div className="w-full max-w-[584px]">
            <Link
              href="/demo"
              className="block p-4 bg-[#223164] hover:bg-[#0e2043] text-white text-center rounded-2xl transition-colors"
            >
              <span className="font-extrabold text-sm sm:text-base">Modo Demostración</span>
            </Link>
          </div>
        </section>

      </div>
    </main>
  );
}
