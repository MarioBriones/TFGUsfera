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

/**
 * Componente para gestión del repositorio mensual y semanal.
 * @function Repositorio
 * @returns {JSX.Element} Vista con archivos organizados por semana y día
 */
export default function Repositorio() {
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

  // 1) Cargar listado de equipos (enum en BD), filtrando 'nada' y dejando 'todo'
  useEffect(() => {
    if (!['director','coordinador'].includes(usuario.rol)) return;
    fetch(`${import.meta.env.VITE_API_URL}/equipos`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          // Quitamos opciones irrelevantes
          const lista = data.equipos.filter(e => e !== 'nada' && e !== 'todo');
          setEquipos(lista);
          // Arrancamos mostrando "todo"
          setSelectedTeam('todo');
        }
      })
      .catch(console.error);
  }, [usuario.rol]);

  // 2) Cargar archivos cada vez que cambia el equipo seleccionado
  useEffect(() => {
    if (!selectedTeam) return;
    fetch(`${import.meta.env.VITE_API_URL}/repositorio/${selectedTeam}`)
      .then(r => r.json())
      .then(data => {
        if (data.success) {
          const m = {};
          data.archivos.forEach(a => {
            // Inicializamos estructuras anidadas
            if (!m[a.semana]) m[a.semana] = {};
            if (!m[a.semana][a.dia]) m[a.semana][a.dia] = [];
            // Añadimos cada archivo al array correspondiente
            m[a.semana][a.dia].push({ name: a.nombre, url: a.ruta, equipo: a.equipo });
          });
          setFiles(m);
        }
      })
      .catch(console.error);
  }, [selectedTeam]);

  /**
 * Sube un archivo al repositorio general.
 * @function handleUpload
 * @async
 * @param {Event} e - Evento del input tipo archivo
 * @returns {Promise<void>}
 */
  const handleUpload = async (semana, dia, file) => {
    const form = new FormData();
    form.append('pdf', file);
    form.append('equipo', selectedTeam);
    form.append('semana', semana);
    form.append('dia', dia);
    form.append('creado_por', usuario.id);

    const res = await fetch(`${import.meta.env.VITE_API_URL}/repositorio?equipo=${selectedTeam}&semana=${semana}&dia=${dia}`, {
  method: 'POST',
  body: form,
});
    const data = await res.json();
    if (!data.success) return;

    // Añadimos el nuevo archivo al estado local sin recargar
    setFiles(prev => {
      const next = { ...prev };
      if (!next[semana]) next[semana] = {};
      if (!Array.isArray(next[semana][dia])) next[semana][dia] = [];
      next[semana][dia] = [
        ...next[semana][dia],
        { name: data.archivo.nombre, url: data.archivo.ruta, equipo: selectedTeam }
      ];
      return next;
    });
  };

 /**
 * Elimina un archivo del repositorio.
 * @function handleDelete
 * @async
 * @param {object} archivo - Información del archivo a eliminar
 * @returns {Promise<void>}
 */
  const handleDelete = async (semana, dia, equipo) => {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/repositorio`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ equipo, semana, dia }),
    });
    const json = await res.json();
    if (!json.success) return;

    // Eliminamos del estado local y limpiamos estructuras vacías
    setFiles(prev => {
      const next = { ...prev };
      if (!next[semana]?.[dia]) return next;
      const filtrado = next[semana][dia].filter(f => f.equipo !== equipo);
      if (filtrado.length) {
        next[semana][dia] = filtrado;
      } else {
        delete next[semana][dia];
        if (!Object.keys(next[semana]).length) delete next[semana];
      }
      return next;
    });
  };

  return (
    <div className="relative flex flex-col min-h-screen bg-gradient-to-b from-red-50 to-white/90">
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
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
              <h1
                className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 cursor-pointer hover:text-red-600 transition pointer-events-auto"
                onClick={() => navigate('/home', { state: { usuario } })}
              >
                USFERA
              </h1>
              <p className="text-sm sm:text-base text-gray-600">Repositorio semanal</p>
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
                      (opt === 'REPOSITORIO'
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
        {/* selector de equipos */}
        {['director','coordinador'].includes(usuario.rol) && (
          <div className="bg-red-50 py-2">
            <div className="max-w-screen-2xl mx-auto px-4 lg:px-8">
              <Select value={selectedTeam} onValueChange={setSelectedTeam} className="w-48">
                <SelectTrigger
                  className="
                    w-full bg-red-50/80 border border-red-300 text-red-900 shadow-md rounded-lg focus:ring-2 focus:ring-red-400 transition
                  "
                >
                  <SelectValue placeholder="Selecciona equipo" />
                </SelectTrigger>
                <SelectContent className="bg-red-50/90 border border-red-200 shadow-xl rounded-lg mt-1">
                  <SelectItem value="todo" className="px-4 py-2 text-red-800 hover:bg-red-100 transition">
                    TODOS
                  </SelectItem>
                  {equipos.map(eq => (
                    <SelectItem key={eq} value={eq} className="px-4 py-2 text-black-800 hover:bg-red-100 transition">
                      {eq.toUpperCase()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </header>

      {/* CONTENIDO PRINCIPAL: grid de semanas */}
      <main className="flex-1 overflow-auto p-6 space-y-4">
        {semanas.map(sem => (
          <Card
            key={sem}
            className="bg-white/60 backdrop-blur-sm shadow-lg hover:shadow-2xl rounded-2xl overflow-auto transition"
          >
            <CardHeader>
              <CardTitle>Semana {sem}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-row gap-4 overflow-x-auto sm:grid sm:grid-cols-6 px-1">
                {dias.map(dia => {
                  const cell = files[sem]?.[dia] ?? []; // array de archivos o vacío
                  return (
                    <div
  key={dia}
  className="min-w-[140px] p-3 bg-white/30 border border-red-200 rounded-xl shadow-inner flex flex-col"
>
                      <strong className="text-sm mb-2 whitespace-nowrap">{dia}</strong>
                      {cell.length > 0 ? (
                        cell.map(f => (
                          <div
  key={`${f.equipo}-${f.name}`}
  className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2"
>
                            <a
  href={`${import.meta.env.VITE_API_URL.replace(/\/$/, '')}/${f.url.replace(/^\//, '')}`}
  target="_blank"
  rel="noopener noreferrer"
  className="text-red-600 underline break-words hover:text-red-800 transition text-sm"
>
  {f.name}
  {selectedTeam === 'todo' && ` (${f.equipo.toUpperCase()})`}
</a>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="text-red-600 hover:bg-red-100 focus:ring-2 focus:ring-red-200 rounded-full p-1"
                              onClick={() => handleDelete(sem, dia, f.equipo)}
                            >
                              🗑️
                            </Button>
                          </div>
                        ))
                      ) : (
                        <label className="mt-auto cursor-pointer text-red-600">
                          + Subir
                          <input
                            type="file"
                            accept="application/pdf"
                            className="hidden"
                            onChange={e => e.target.files?.[0] && handleUpload(sem, dia, e.target.files[0])}
                          />
                        </label>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
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