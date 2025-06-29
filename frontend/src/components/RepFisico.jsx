//RepFisico.jsx
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

export default function RepFisico() {
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

  const opcionesSubmenu = [
    { label: 'Tests', path: '/testsfisicos' },
    { label: 'Repositorio', path: '/repositoriofisico' },
    { label: 'Seguimiento Diario', path: '/rpe' },
  ];

  // Estado local: listado de equipos (solo para director/coordinador)
  const [equipos, setEquipos] = useState([]);
  // Equipo seleccionado en el desplegable
  const [selectedTeam, setSelectedTeam] = useState(
  ["coordinador", "director"].includes(usuario.rol) ? "juvenila" : usuario.equipo
);

  // URL de avatar del usuario (fallback si no existe)
  const fotoSrc = `${import.meta.env.BASE_URL}fotos/${slugify(usuario.nombre || 'avatar-blank')}.png`;

  const [archivos, setArchivos] = useState([]);
const [subiendo, setSubiendo] = useState(false);
const diasSemana = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];

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

  useEffect(() => {
    if (["coordinador", "director"].includes(usuario.rol)) {
      fetch(`${import.meta.env.VITE_API_URL}/equipos`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            const filtrados = data.equipos.filter((e) => e !== 'nada' && e !== 'todo');
            setEquipos(filtrados);
            setSelectedTeam('todo');
          }
        });
    }
  }, [usuario.rol]);

  useEffect(() => {
  if (
    ["coordinador", "director"].includes(usuario.rol) &&
    (!selectedTeam || selectedTeam === "todo") &&
    equipos.includes("juvenila")
  ) {
    setSelectedTeam("juvenila");
  }
}, [usuario.rol, selectedTeam, equipos]);

const [jugadores, setJugadores] = useState([]);

useEffect(() => {
  if (!selectedTeam) return;

  fetch(`${import.meta.env.VITE_API_URL}/jugadores/${selectedTeam}`)
    .then((r) => r.json())
    .then((data) => {
      if (data.success) {
        setJugadores(data.jugadores);
      }
    })
    .catch(console.error);
}, [selectedTeam]);

  useEffect(() => {
    if (["coordinador", "director"].includes(usuario.rol) && (!selectedTeam || selectedTeam === "todo") && equipos.includes("juvenila")) {
      setSelectedTeam("juvenila");
    }
  }, [usuario.rol, selectedTeam, equipos]);

  useEffect(() => {
    if (!selectedTeam) return;
    fetch(`${import.meta.env.VITE_API_URL}/repositoriofisico/${selectedTeam}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) setArchivos(data.archivos);
      });
  }, [selectedTeam, subiendo]);

  const agruparPorSemanaDia = () => {
    const mapa = {};
    archivos.forEach(a => {
      if (!mapa[a.semana]) mapa[a.semana] = {};
      mapa[a.semana][a.dia] = a;
    });
    return mapa;
  };

  const archivosPorSemana = agruparPorSemanaDia();

const handleSubir = async (semana, dia) => {
  if (!selectedTeam || selectedTeam === 'todo') {
    alert("Selecciona un equipo válido.");
    return;
  }

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/pdf';
  input.onchange = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('equipo', selectedTeam);
    formData.append('semana', semana);
    formData.append('dia', dia);
    formData.append('nombre', archivo.name);
    formData.append('creado_por', usuario.id);

    setSubiendo(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/repositoriofisico/subir?equipo=${selectedTeam}&semana=${semana}&dia=${dia}&nombre=${encodeURIComponent(archivo.name)}&creado_por=${usuario.id}`, {
  method: 'POST',
  body: formData
});
      const data = await res.json();
      if (!data.success) console.error("❌ Error al subir archivo:", data);
    } catch (err) {
      console.error("❌ Error de red:", err);
    }
   setSubiendo(prev => !prev);  // Esto forzará el useEffect a ejecutarse
  };
  input.click();
  
};

const subirGuiaBloque = (bloque) => {
  if (!selectedTeam || selectedTeam === 'todo') {
    alert("Selecciona un equipo válido.");
    return;
  }

  const input = document.createElement('input');
  input.type = 'file';
  input.accept = 'application/pdf';
  input.onchange = async (e) => {
    const archivo = e.target.files[0];
    if (!archivo) return;

    const formData = new FormData();
    formData.append('archivo', archivo);
    formData.append('equipo', selectedTeam);
    formData.append('bloque', bloque);
    formData.append('nombre', archivo.name);
    formData.append('creado_por', usuario.id);

    setSubiendo(true);
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/repositoriofisico/guia?equipo=${selectedTeam}&bloque=${bloque}&nombre=${encodeURIComponent(archivo.name)}&creado_por=${usuario.id}`, {
  method: 'POST',
  body: formData
});
      const data = await res.json();
      if (!data.success) console.error("❌ Error al subir guía:", data);
    } catch (err) {
      console.error("❌ Error de red al subir guía:", err);
    }
    setSubiendo(prev => !prev);  // Esto forzará el useEffect a ejecutarse
  };
  input.click();
   
};
// Nueva función para borrar
const handleBorrar = async (id) => {
  const confirmar = window.confirm("¿Estás seguro de que deseas eliminar este archivo?");
  if (!confirmar) return;

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/repositoriofisico/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!data.success) console.error("❌ Error al eliminar archivo", data);
  } catch (err) {
    console.error("❌ Error de red al eliminar archivo", err);
  }
  setSubiendo(prev => !prev);
};

  const renderBloques = () => {
    const bloques = [];
    
    for (let b = 1; b <= 10; b++) {
      const inicio = (b - 1) * 4 + 1;
      const fin = b * 4;
      const guia = archivos.find(a =>
  a.semana === inicio &&
  a.dia === 'GuíaBloque'
);
      bloques.push(
        <div key={b} className="border rounded p-4 mb-6 shadow bg-white">
          <div className="flex justify-between items-center mb-2">
  <h2 className="text-lg font-semibold">
    📦 Bloque {b} (Semanas {inicio} a {fin})
  </h2>
  <div className="flex gap-2">
    {guia && (
      <>
      <a
        href={`${import.meta.env.VITE_API_URL}/${guia.ruta}`}
        target="_blank"
        className="text-red-700 underline text-sm"
              >
                {guia.nombre}
              </a>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleBorrar(guia.id)}
                className="text-sm text-gray-500 hover:text-red-600"
              >
                ❌
              </Button></>
            
    )}
    {['coordinador', 'director'].includes(usuario.rol) && !guia && (
  <Button
    variant="outline"
    size="sm"
    onClick={() => subirGuiaBloque(b)}
  >
    Subir guía
  </Button>
)}
  </div>
</div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            {Array.from({ length: 4 }, (_, i) => {
              const semana = inicio + i;
              return (
                <div key={semana} className="border p-2 rounded shadow-sm bg-red-50">
                  <h3 className="font-medium text-red-700 mb-2">Semana {semana}</h3>
                  <ul className="flex flex-col gap-2">
                    {diasSemana.map(dia => {
                      const archivo = archivosPorSemana?.[semana]?.[dia];
                      return (
                        <li key={dia} className="flex justify-between items-center">
                          <span>{dia}</span>
                          {archivo ? (
                            <>
                            <a
                              href={`${import.meta.env.VITE_API_URL}/${archivo.ruta}`}
                              target="_blank"
                              className="text-red-700 underline text-sm"
                            >
                              {archivo.nombre}
                            </a>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleBorrar(archivo.id)}
                              className="text-sm text-gray-500 hover:text-red-600"
                            >
                              ❌
                            </Button>
                          </>
                          ) : (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleSubir(semana, dia)}
                            >
                              Subir
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>
      );
    }
    return bloques;
  };



///////////////////////
  return (
    <div
    className="relative flex flex-col min-h-screen bg-cover bg-center"
    style={{
      backgroundImage: `url(${import.meta.env.BASE_URL}central.png)`,
      backgroundColor: 'rgba(255, 255, 255, 0.8)', // suaviza el fondo como en Plantilla
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

        {/* Submenú con resaltado del activo */}
<div className="bg-red-100 py-2 shadow-inner">
  <div className="max-w-screen-xl mx-auto px-4 flex justify-center gap-4">
    {opcionesSubmenu.map((opt) => (
      <Button
        key={opt.label}
        variant={location.pathname.includes(opt.path) ? "default" : "ghost"}
        className={
          location.pathname.includes(opt.path)
            ? "bg-red-600 text-white font-semibold shadow"
            : "text-red-800 hover:bg-red-200 font-semibold"
        }
        onClick={() => navigate(opt.path, { state: { usuario } })}
      >
        {opt.label}
      </Button>
    ))}
  </div>
</div>

{/* Selector de equipo si es coordinador/director */}
{["coordinador", "director"].includes(usuario.rol) && (
  <div className="bg-red-50 py-4 flex justify-center">
    <Select
      value={selectedTeam}
      onValueChange={setSelectedTeam}
    >
      <SelectTrigger className="w-64">
        <SelectValue placeholder="Selecciona equipo" />
      </SelectTrigger>
      <SelectContent>
        {equipos
          .filter((eq) => !["nada", "todo"].includes(eq.toLowerCase()))
          .map((eq) => (
            <SelectItem key={eq} value={eq}>
              {eq.toUpperCase()}
            </SelectItem>
          ))}
      </SelectContent>
    </Select>
  </div>
)}
      </header>






      <main className="flex-grow px-6 py-8 max-w-screen-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 text-red-700">Repositorio Físico Semanal</h1>
        {selectedTeam ? renderBloques() : <p className="text-gray-500">Selecciona un equipo...</p>}
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