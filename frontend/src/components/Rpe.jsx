// Rpe.jsx
import { useMemo } from 'react';
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

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from 'recharts';



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
 * Componente para seguimiento diario de RPE (valoración del esfuerzo).
 * @function Rpe
 * @returns {JSX.Element} Vista con valores por jugador, semana y día
 */
export default function Rpe() {
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

const [jugadores, setJugadores] = useState([]);
const diasSemana = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];
const meses = [
  'Julio 2025', 'Agosto 2025', 'Septiembre 2025', 'Octubre 2025',
  'Noviembre 2025', 'Diciembre 2025', 'Enero 2026', 'Febrero 2026',
  'Marzo 2026', 'Abril 2026', 'Mayo 2026', 'Junio 2026'
];

/**
 * Calcula las semanas que pertenecen a un mes específico.
 * @function generarSemanasMes
 * @param {number} mes - Número del mes (0–11)
 * @returns {number[]} Array con semanas correspondientes al mes
 */
const generarSemanasMes = (mesIndex) => {
  const base = mesIndex * 4;
  return Array.from({ length: 4 }, (_, i) => base + i + 1); // Semana 1 a 48
};
const [mesesAbiertos, setMesesAbiertos] = useState({});

/**
 * Abre o cierra el bloque visual de un mes concreto.
 * @function toggleMes
 * @param {number} mes - Número del mes
 * @returns {void}
 */
const toggleMes = (mes) => {
    setMesesAbiertos((prev) => ({ ...prev, [mes]: !prev[mes] }));
  };
const [diaActivo, setDiaActivo] = useState(null); // identificador único: `${mes}_${semana}_${dia}`
const [valoresRPE, setValoresRPE] = useState({});
const [subiendo, setSubiendo] = useState(false);

// Nueva constante de estado
const [mostrarEstadisticas, setMostrarEstadisticas] = useState(false);
const [semanaSeleccionada, setSemanaSeleccionada] = useState(null);

/**
 * Comprueba si hay datos RPE cargados para una semana dada.
 * @function semanaTieneDatos
 * @param {number} semana - Número de la semana
 * @returns {boolean} True si hay al menos un dato, false en caso contrario
 */
const semanaTieneDatos = (semana) => {
  return rpes.some(r => r.semana === semana);
};

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

const [rpes, setRpes] = useState([]);

useEffect(() => {
  if (!selectedTeam) return;
  fetch(`${import.meta.env.VITE_API_URL}/rpe/${selectedTeam}`)
    .then(res => res.json())
    .then(data => {
      if (data.success) setRpes(data.rpe);
    })
    .catch(console.error);
}, [selectedTeam, subiendo]); // si subiendo cambia tras guardar, se recarga



  useEffect(() => {
    if (["coordinador", "director"].includes(usuario.rol) && (!selectedTeam || selectedTeam === "todo") && equipos.includes("juvenila")) {
      setSelectedTeam("juvenila");
    }
  }, [usuario.rol, selectedTeam, equipos]);

  /**
 * Guarda los valores RPE introducidos por el usuario en un día concreto.
 * @function guardarRPE
 * @async
 * @param {number} semana - Semana
 * @param {string} dia - Día de la semana
 * @returns {Promise<void>}
 */
const guardarRPE = async (mes, semana, dia) => {
  const datos = Object.entries(valoresRPE).map(([jugadorId, valor]) => ({
    jugador_id: parseInt(jugadorId, 10),
    valor: parseInt(valor, 10),
  }));

  const payload = {
    equipo: selectedTeam,
    mes,
    semana,
    dia,
    datos,
    creado_por: usuario.id,
  };

  try {
    setSubiendo(true);
    const res = await fetch(`${import.meta.env.VITE_API_URL}/rpe`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.success) {
      console.error("❌ Error al guardar RPE:", data.error);
      alert("Error al guardar RPE");
    } else {
      setDiaActivo(null);
      setValoresRPE({});
    }
  } catch (err) {
    console.error("❌ Error de red al guardar RPE", err);
  } finally {
    setSubiendo(false);
  }
};

/**
 * Elimina todos los valores RPE de un día concreto para un equipo.
 * @function borrarRPE
 * @async
 * @param {number} mes - Número del mes (0–11)
 * @param {number} semana - Número de la semana (1–40 aprox.)
 * @param {string} dia - Día de la semana ('Lunes', 'Martes'…)
 * @returns {Promise<void>} Resultado de la operación de borrado
 */
const borrarRPE = async (mes, semana, dia) => {
  const confirmar = window.confirm("¿Eliminar los valores RPE de este día?");
  if (!confirmar) return;

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/rpe`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ equipo: selectedTeam, mes, semana, dia })
    });
    const data = await res.json();
    if (!data.success) {
      console.error("❌ Error al borrar RPE", data.error);
    } else {
      setSubiendo(prev => !prev);  // Forzar reload
    }
  } catch (err) {
    console.error("❌ Error de red al borrar RPE", err);
  }
};    


/**
 * Comprueba si hay valores RPE para una combinación de mes, semana y día.
 * @function tieneRPE
 * @param {number} mes - Mes a comprobar
 * @param {number} semana - Semana a comprobar
 * @param {string} dia - Día a comprobar
 * @returns {boolean} True si hay RPE asignado, false en caso contrario
 */
const tieneRPE = (mes, semana, dia) => {
  return rpes.some(r =>
    r.mes === mes && r.semana === semana && r.dia === dia
  );
};

/**
 * Calcula los valores RPE por jugador en la semana seleccionada.
 * @function datosPorJugador
 * @returns {object[]} Lista de jugadores con sus valores diarios
 */
const datosPorJugador = useMemo(() => {
  if (!semanaSeleccionada || jugadores.length === 0 || rpes.length === 0) return [];

  return jugadores.map(j => {
    const datos = diasSemana.map(dia => {
      const entry = rpes.find(r => r.jugador_id === j.id && r.dia === dia && r.semana === semanaSeleccionada);
      return {
        dia,
        valor: entry?.valor || null,
      };
    });
    return {
      jugador: j.apodo || j.nombre,
      datos,
    };
  });
}, [jugadores, rpes, semanaSeleccionada]);

/**
 * Calcula la media de RPE por jugador para generar la barra general semanal.
 * @function datosBarraGeneral
 * @returns {object[]} Media semanal de esfuerzo por jugador
 */
const datosBarraGeneral = useMemo(() => {
  if (!semanaSeleccionada || jugadores.length === 0 || rpes.length === 0) return [];

  return jugadores.map(jugador => {
    const datosJugador = rpes.filter(r => r.jugador_id === jugador.id && r.semana === semanaSeleccionada);
    const media =
      datosJugador.length > 0
        ? datosJugador.reduce((sum, r) => sum + r.valor, 0) / datosJugador.length
        : 0;
    return {
      jugador: jugador.apodo || jugador.nombre,
      media: Math.round(media * 10) / 10,
    };
  });
}, [jugadores, rpes, semanaSeleccionada]);

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
   {/* <div className="relative flex flex-col min-h-screen bg-gradient-to-b from-red-50 to-white/90">*/}
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


<main className="w-full overflow-x-hidden flex-grow px-8 py-10 max-w-screen-2xl mx-auto text-base space-y-4">
      {meses.map((mes, idx) => {
        const semanas = generarSemanasMes(idx);
        const abierto = mesesAbiertos[mes];
        return (
          <div key={mes} className="rounded-xl shadow-md border border-red-300 bg-white overflow-hidden mb-6">
            <button
  onClick={() => toggleMes(mes)}
  className="w-full text-left px-6 py-3 bg-red-100 hover:bg-red-200 text-base font-semibold text-red-700 tracking-wide"
>
  📅 {mes}  ⌵
</button>
            {abierto && (
              <div className="divide-y">
                {semanas.map((sem) => (
                  <div key={sem} className="p-4 border-t">
                    <h3 className="font-semibold text-red-600 mb-2">Semana {sem}</h3>
                    {semanaTieneDatos(sem) && (
  <button
    className="text-sm text-red-700 underline mb-3"
    onClick={() => {
      setSemanaSeleccionada(sem);
      setMostrarEstadisticas(true);
    }}
  >
   📊 Ver estadísticas individuales y grupales de la semana.
  </button>
)}
                    <div className="flex gap-3 overflow-x-auto sm:grid sm:grid-cols-5 sm:gap-4 sm:overflow-x-visible pl-4 pr-4 sm:px-0">
                      {diasSemana.map((dia) => (
                        <div
  key={dia}
  className="flex-shrink-0 w-[140px] sm:w-auto rounded-lg border border-red-200 bg-red-50 p-3 text-center shadow-sm flex flex-col justify-between min-h-[140px]"
>
                          <p className="font-semibold text-red-800 text-sm mb-1">{dia}</p>
                          {tieneRPE(mes, sem, dia) ? (
 <>
    <div className="flex flex-col items-center">
  <span className="text-green-600 text-sm font-semibold text-center">✔ RPE registrado</span>
  <button className="text-xs text-red-600 underline mt-1"
  onClick={() => borrarRPE(mes, sem, dia)}
>
  🔻Eliminar RPE
</button></div>
    
  </>
) : (
  <button className="text-xs bg-white border border-red-400 text-red-600 rounded px-2 py-1 hover:bg-red-100 transition w-full"
  onClick={() => setDiaActivo(`${mes}_${sem}_${dia}`)}
>
  Añadir RPE
</button>
)}
{diaActivo === `${mes}_${sem}_${dia}` && (
  <div className="mt-2 bg-white border border-red-300 rounded p-2 space-y-3 text-left max-h-[300px] overflow-y-auto text-sm">
    {jugadores.map(j => (
      <div key={j.id} className="flex flex-col border-b pb-2">
        <span className="font-medium text-gray-800 mb-1">{j.apodo || j.nombre}</span>
        <input
          type="number"
          min="1"
          max="10"
        className="w-full px-3 py-1.5 border rounded bg-red-50 text-center focus:outline-none focus:ring-1 focus:ring-red-400"
          value={valoresRPE[`${j.id}`] || ''}
          onChange={(e) =>
            setValoresRPE({ ...valoresRPE, [j.id]: parseInt(e.target.value, 10) })
          }
        />
      </div>
    ))}
    <div className="flex flex-col gap-2 pt-2">
      
      <button
        className="text-sm bg-red-600 text-white font-semibold px-4 py-1 rounded shadow hover:bg-red-700"
        onClick={() => guardarRPE(mes, sem, dia)}
      >
      Guardar 
      </button>
      
      <button
        className="text-sm text-red-600 underline"
        onClick={() => {
          setDiaActivo(null);
          setValoresRPE({});
        }}
      >
        Cancelar
      </button>
      
    </div>
  </div>
)}
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </main>

{mostrarEstadisticas && semanaSeleccionada && (
  <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-2">
  <div className="bg-white rounded-xl shadow-lg p-6 w-full max-w-[95%] h-[95vh] overflow-auto relative">
      <button
        className="absolute top-4 right-4 text-xl text-gray-600 hover:text-black"
        onClick={() => setMostrarEstadisticas(false)}
      >
        ✖
      </button>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
        <div className="overflow-y-auto max-h-[90vh] pr-4">
  <h3 className="text-lg font-semibold mb-4 text-red-700">📈 Evolución semanal individual</h3>
  <div className="space-y-6">
    {datosPorJugador.map(j => (
      <div key={j.jugador} className="bg-red-50 border border-red-200 rounded p-3 shadow-sm">
        <p className="font-semibold text-sm text-red-700 mb-1">{j.jugador}</p>
        <ResponsiveContainer width="100%" height={100}>
          <LineChart data={j.datos}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="dia" tick={{ fontSize: 10 }} />
            <YAxis domain={[1, 10]} tick={{ fontSize: 10 }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="valor"
              stroke="#d11a2a"
              strokeDasharray="5 2"
              dot={{ r: 3 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    ))}
  </div>
</div>

        <div className="overflow-x-auto max-w-full h-full flex flex-col justify-center">
          <h3 className="text-lg font-semibold mb-2 text-red-700">📊 Media semanal por jugador</h3>
          <ResponsiveContainer width={Math.max(jugadores.length * 60, 600)} height={300}>
            <BarChart data={datosBarraGeneral}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="jugador" interval={0} angle={-30} textAnchor="end" />
              <YAxis domain={[1, 10]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="media" fill="#d11a2a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  </div>
)}

     




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