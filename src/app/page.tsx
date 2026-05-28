import { Navbar } from '@/components/layout/Navbar';
import { RoleCard } from '@/components/ui/RoleCard';
import Image from 'next/image';

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

        {/* Sección Derecha/Inferior: Selección de Roles */}
        {/* En móviles (por defecto) es flex-col, en escritorio es md:flex-row */}
        <section className="flex flex-col sm:flex-row md:flex-row items-center justify-center gap-6 md:gap-12 flex-1 w-full">
          <RoleCard
            title="Soy administrador"
            iconPath="/images/admin-icon.svg"
            href="/auth/admin"
            buttonColor="bg-[#223164] hover:bg-[#0e2043]"
          />
          
          <RoleCard
            title="Soy jurado"
            iconPath="/images/jury-icon.svg"
            href="/auth/jury"
            buttonColor="bg-[#e8af2e] hover:bg-[#d49f25]"
          />
        </section>

      </div>
    </main>
  );
}