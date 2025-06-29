// Repositorio.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';


// Función auxiliar para generar slugs de nombres (para URLs de imágenes)
function slugify(nombre) {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-\u036f]/g, '') // elimina acentos
    .replace(/\s+/g, '-')       // espacios a guiones
    .replace(/[^\w-]/g, '');    // elimina caracteres especiales
}

export default function PreparacionFisica() {
  // Recuperamos el usuario del estado de navegación (pasado desde Inicio.jsx)
  const { state } = useLocation();
  const usuario = state?.usuario || {};
  const navigate = useNavigate();

  // Definimos el menú superior según rol (entrenador vs director/coordinador)
  const opcionesEntrenador = [
    'PLANTILLA', 'REPOSITORIO', 'METODOLOGÍA', 'PREP. FÍSICA', 'SCOUT',  
  ];
  const opcionesDirCoord = [
    'PLANTILLAS', 'REPOSITORIO', 'METODOLOGÍA', 'PREP. FÍSICA', 'SCOUT', 'CUENTAS',  
  ];
  const opcionesMenu = ['director', 'coordinador'].includes(usuario.rol)
    ? opcionesDirCoord
    : opcionesEntrenador;

  // Estado local: listado de equipos (solo para director/coordinador)
  const [equipos, setEquipos] = useState([]);
  // Equipo seleccionado en el desplegable
  const [selectedTeam, setSelectedTeam] = useState(usuario.equipo);

  // Estructura de archivos cargados: files[semana][dia] = array de objetos { name, url, equipo }
  const [files, setFiles] = useState({});

  // Definimos semanas y días (
  // semanas: 1..40, dias: Lunes..Convocatoria)
  const semanas = Array.from({ length: 40 }, (_, i) => i + 1);
  const dias = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Convocatoria'];

  // URL de avatar del usuario (fallback si no existe)
  const fotoSrc = `${import.meta.env.BASE_URL}fotos/${slugify(usuario.nombre || 'avatar-blank')}.png`;

// Cumpleaños pie de pagina
  const [proximosCumples, setProximosCumples] = useState([]);
  
  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/cumples`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) return;
  
        const hoy = new Date();
        const esCoordDir = ['coordinador', 'director'].includes(usuario.rol);
        const miEquipo = usuario.equipo?.toLowerCase();
  
        // Filtramos por equipo si no es director ni coordinador
        const jugadoresFiltrados = esCoordDir
          ? data.jugadores
          : data.jugadores.filter(j => j.equipo.toLowerCase() === miEquipo);
  
        const startOfToday = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const conCumple = jugadoresFiltrados
    .map(j => {
      const fechaNac = new Date(j.fecha_nacimiento);
      const cumpleEsteAnio = new Date(hoy.getFullYear(), fechaNac.getMonth(), fechaNac.getDate());
      if (cumpleEsteAnio < startOfToday) cumpleEsteAnio.setFullYear(hoy.getFullYear() + 1);
  
      return {
        ...j,
        cumpleDate: cumpleEsteAnio,
        diasParaCumple: Math.floor((cumpleEsteAnio - startOfToday) / (1000 * 60 * 60 * 24)),
      };
    })
    .sort((a, b) => a.diasParaCumple - b.diasParaCumple)
    .slice(0, 3);
  
        setProximosCumples(conCumple);
      })
      .catch(console.error);
  }, [usuario]);

  

  return (
    <div
    className="relative flex flex-col min-h-screen bg-cover bg-center"
    style={{
      backgroundImage: `url(${import.meta.env.BASE_URL}central.png)`,
      backgroundColor: 'rgba(255, 255, 255, 0.3)', // suaviza el fondo como en Plantilla
      backgroundBlendMode: 'lighten', // ajusta cómo se mezcla la imagen y el color
    }}
  >
      {/* HEADER FIJO */}
      <header className="sticky top-0 z-50">
        <div className="h-1 bg-gray-400 w-full" />
        <div className="bg-gray-200">
          <div className="relative flex items-center justify-between w-full px-4 sm:px-6 lg:px-8 py-3">
            {/* Escudo clicable vuelve al home */}
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Escudo Unionistas"
              className="h-12 w-12 cursor-pointer flex-shrink-0"
              onClick={() => navigate('/home', { state: { usuario } })}
            />
            {/* Título centrar con absolute para no alterar el flow */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <h1
                className="text-2xl sm:text-3xl font-bold text-gray-800 cursor-pointer hover:text-red-600 transition pointer-events-auto"
                onClick={() => navigate('/home', { state: { usuario } })}
              >
                USFERA
              </h1>
              <p className="text-sm sm:text-base text-gray-600">Preparación Física</p>
            </div>
            {/* Avatar y botón Cerrar Sesión */}
                        <div className="flex items-center space-x-2">
                          <img
                            src={fotoSrc}
                            alt={`Avatar de ${usuario.nombre}`}
                            className="h-8 w-8 rounded-full object-cover border-2 border-white shadow-sm hidden sm:inline-block"
                            onError={e => (e.currentTarget.src = `${import.meta.env.BASE_URL}fotos/avatar-blank.png`)}
                          />
                          <Button
                            variant="outline"
                            className="bg-transparent border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition"
                            onClick={() => navigate('/', { state: { usuario } })}
                          >
                            Cerrar Sesión
                          </Button>
                        </div>
                      </div>
                    </div>
                   <div className="h-px bg-gray-400 w-full" />
                    <div className="bg-red-50">
                      <nav className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                        <ul className="flex flex-wrap justify-center gap-2 sm:gap-4 py-2 text-sm">
              {opcionesMenu.map(opt => (
                <li key={opt}>
                  <button
                    onClick={() =>
                      navigate(`/${opt.toLowerCase().replace(/\s+/g, '')}`, { state: { usuario } })
                    }
                    className={
                      `px-3 py-1 rounded transition ` +
                      (opt === 'PREP. FÍSICA'
                        ? 'bg-gray-300 text-black'
                        : 'text-gray-700 hover:text-white hover:bg-red-600')
                    }
                  >
                    {opt}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        {/* línea divisoria roja */}
        <div className="h-1 bg-red-600 w-full" />
      </header>

     <main className="flex-grow p-8 bg-gradient-to-b from-red-50 to-white/90">
  <div className="max-w-screen-xl mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
    {/* Card 1: Tests */}
    <Card className="shadow-xl hover:shadow-2xl transition cursor-pointer" onClick={() => navigate('/testsfisicos', { state: { usuario } })}>
      <CardHeader>
        <CardTitle className="text-xl text-red-700 font-bold">🧪 Tests Cuantificables</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-gray-700">
        Crea nuevos tests, asigna valoraciones y calificaciones a los jugadores y consulta clasificaciones ordenadas viendo su progreso a lo largo de la temporada.
      </CardContent>
      <CardFooter className="text-right">
        <Button className="ml-auto">Acceder</Button>
      </CardFooter>
    </Card>

    {/* Card 2: Repositorio */}
    <Card className="shadow-xl hover:shadow-2xl transition cursor-pointer" onClick={() => navigate('/repositoriofisico', { state: { usuario } })}>
      <CardHeader>
        <CardTitle className="text-xl text-red-700 font-bold">📂 Repositorio Semanal</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-gray-700">
        Organiza y consulta los contenidos físicos por mes y semana. Sube archivos las sesiones de gimnasio y ve el contenido a realizar marcadado por el Departamento de Preparación Física.
      </CardContent>
      <CardFooter className="text-right">
        <Button className="ml-auto">Acceder</Button>
      </CardFooter>
    </Card>

    {/* Card 3: Seguimiento */}
    <Card className="shadow-xl hover:shadow-2xl transition cursor-pointer" onClick={() => navigate('/rpe', { state: { usuario } })}>
      <CardHeader>
        <CardTitle className="text-xl text-red-700 font-bold">📊 Seguimiento Diario (RPE)</CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-gray-700">
        Asigna valores diarios en cuanto a cansancio y estado por jugador y genera estadísticas semanales por jugador y grupo.
      </CardContent>
      <CardFooter className="text-right">
        <Button className="ml-auto">Acceder</Button>
      </CardFooter>
    </Card>
  </div>
</main>

      {/* ——— FOOTER ——— */}
      <footer className="bg-gray-100 py-4">
  <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 items-center gap-4">
    {/* Izquierda */}
    <div className="text-sm text-gray-600 text-center md:text-left">
      Página diseñada y en pruebas por Mario Briones
    </div>

    {/* Centro */}
    <div className="flex justify-center">
      <img
        src={`${import.meta.env.BASE_URL}pie.png`}
        alt="Sello pie de página"
        className="h-16 w-auto"
      />
    </div>

    {/* Derecha: Cumples */}
    <div className="flex flex-col items-center md:items-end text-sm text-gray-700">
      <span className="font-semibold text-black-700  mb-1">
        🎂 Próximos cumpleaños
      </span>
      {proximosCumples.length === 0 ? (
        <span className="text-gray-500 italic">Sin cumpleaños cercanos</span>
      ) : (
        <ul className="flex flex-col gap-1">
          {proximosCumples.map((j, idx) => {
            const hoy = new Date();
            const esHoy =
              j.cumpleDate.getDate() === hoy.getDate() &&
              j.cumpleDate.getMonth() === hoy.getMonth();
            const dia = j.cumpleDate.getDate();
            const mes = j.cumpleDate.toLocaleDateString('es-ES', { month: 'long' });

            return (
  <li
  key={idx}
  className={`text-center ${
    esHoy
      ? 'text-red-700 bg-yellow-100 px-2 py-1 rounded shadow animate-pulse'
      : 'text-gray-700'
  }`}
>
  <span className={`text-xs sm:text-sm font-medium ${esHoy ? 'font-bold' : ''}`}>
    {esHoy && '🎉 '}
    {j.apodo?.toUpperCase() || 'SIN NOMBRE'} ({j.equipo?.toUpperCase() || 'SIN EQUIPO'}) – {dia} de {mes.charAt(0).toUpperCase() + mes.slice(1)}
    {esHoy && ' 🎉'}
  </span>
</li>
);
          })}
        </ul>
      )}
    </div>
  </div>
</footer>
    </div>
  );
}