// Cuentas.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';


function slugify(nombre) {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
}

/**
 * Componente de gestión de cuotas anuales por equipo.
 * @function Cuentas
 * @returns {JSX.Element} Vista con control de pagos y generación de PDF
 */
export default function Cuentas() {
  const { state } = useLocation();
  const usuario = state?.usuario || {};
  const navigate = useNavigate();

  const [equipoAbierto, setEquipoAbierto] = useState(null);

  if (!['director', 'coordinador'].includes(usuario.rol)) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-lg font-semibold text-red-600">Acceso restringido. Solo coordinadores y director pueden ver esta página.</p>
      </div>
    );
  }

  const opcionesMenu = [
    'PLANTILLAS', 'REPOSITORIO', 'METODOLOGÍA', 'PREP. FÍSICA', 'SCOUT', 'CUENTAS',  
  ];

  const fotoSrc = `${import.meta.env.BASE_URL}fotos/${slugify(usuario.nombre || 'avatar-blank')}.png`;
  const [proximosCumples, setProximosCumples] = useState([]);
  const [equipos, setEquipos] = useState([]);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/equipos`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          const filtrados = data.equipos.filter(e => e !== 'nada' && e !== 'todo');
          setEquipos(filtrados);
        }
      });
  }, []);

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/cumples`)
      .then((r) => r.json())
      .then((data) => {
        if (!data.success) return;
        const hoy = new Date();
        const startOfToday = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
        const conCumple = data.jugadores
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
      });
  }, []);

const [jugadoresConPagos, setJugadoresConPagos] = useState([]);

useEffect(() => {
  if (!equipoAbierto) return;
  fetch(`${import.meta.env.VITE_API_URL}/cuotas/${equipoAbierto}`)
    .then(r => r.json())
    .then(data => {
      if (data.success) setJugadoresConPagos(data.jugadores);
    })
    .catch(console.error);
}, [equipoAbierto]);

/**
 * Cambia el estado de pago de un jugador en una cuota concreta.
 * @function togglePago
 * @param {string} jugadorId - ID del jugador
 * @param {number} index - Índice del pago (0, 1, 2)
 * @returns {void}
 */
const togglePago = (jugador_id, pagoIndex, valor) => {
  const confirmar = window.confirm(
    valor
      ? `¿Confirmas marcar el pago ${pagoIndex + 1} como pagado?`
      : `¿Confirmas quitar el estado pagado del pago ${pagoIndex + 1}?`
  );
  if (!confirmar) return;

  fetch(`${import.meta.env.VITE_API_URL}/cuotas/actualizar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      jugador_id,
      equipo: equipoAbierto,
      pagoIndex,
      valor
    })
  })
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        setJugadoresConPagos(prev =>
          prev.map(j =>
            j.id === jugador_id
              ? { ...j, [`pago${pagoIndex + 1}`]: valor } // ojo, aquí sí va +1
              : j
          )
        );
      } else {
        alert('Error al actualizar el pago');
      }
    })
    .catch(err => {
      console.error('Error al actualizar pago:', err);
      alert('Error de conexión al actualizar el pago');
    });
};

/**
 * Devuelve los precios por categoría del equipo.
 * @function obtenerPrecios
 * @param {string} equipo - Nombre del equipo
 * @returns {number[]} Array con precios por pago
 */
function obtenerPrecios(equipo) {
  const equipos450 = [
    'prebenjamina', 'prebenjaminb', 'prebenjaminc',
    'benjamina', 'benjaminb', 'benjaminc'
  ];
  if (equipos450.includes(equipo.toLowerCase())) return [150, 150, 150];
  return [145, 200, 200]; // resto
}

/**
 * Genera y descarga un PDF con las cuotas pendientes del equipo.
 * @function descargarPendientesPDF
 * @async
 * @returns {Promise<void>} Nada si el PDF se genera correctamente
 */
const descargarPendientesPDF = async (equipo) => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/cuotas/pendientes/${equipo}`);
    const data = await res.json();
    if (!data.success) throw new Error("Fallo al obtener pendientes");

    const pendientes = data.jugadores;

    if (pendientes.length === 0) {
      alert("Todos los jugadores tienen la cuota completa");
      return;
    }

    const response = await fetch(`${import.meta.env.VITE_API_URL}/generar-pdf-cuotas`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jugadores: pendientes,
        equipo,
        temporada: "2025-2026"
      }),
    });

    if (!response.ok) throw new Error("Error al recibir el PDF");

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `pendientes_${equipo}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  } catch (err) {
    console.error("Error al generar PDF:", err);
    alert("❌ Error al generar el PDF");
  }
};







  return (
    <div className="relative flex flex-col min-h-screen bg-cover bg-center" style={{
      backgroundImage: `url(${import.meta.env.BASE_URL}central.png)`,
      backgroundColor: 'rgba(255, 255, 255, 0.8)',
      backgroundBlendMode: 'lighten'
    }}>
     <header className="sticky top-0 z-50">
        <div className="h-1 bg-gray-400 w-full" />
        <div className="bg-gray-200">
          <div className="relative flex items-center justify-between w-full px-4 sm:px-6 lg:px-8 py-3">
            <img src={`${import.meta.env.BASE_URL}logo.png`} alt="Escudo Unionistas" className="h-12 w-12 cursor-pointer flex-shrink-0" onClick={() => navigate('/home', { state: { usuario } })} />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 cursor-pointer hover:text-red-600 transition pointer-events-auto" onClick={() => navigate('/home', { state: { usuario } })}>USFERA</h1>
              <p className="text-sm sm:text-base text-gray-600">Control de cuotas</p>
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
                    onClick={() => navigate(`/${opt.toLowerCase().replace(/\s+/g, '')}`, { state: { usuario } })}
                    className={`px-3 py-1 rounded transition ${opt === 'CUENTAS' ? 'bg-gray-300 text-black' : 'text-gray-700 hover:text-white hover:bg-red-600'}`}
                  >
                    {opt}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>
        <div className="h-1 bg-red-600 w-full" />
      </header>

      <main className="flex-grow p-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {equipos.map(eq => (
  <React.Fragment key={eq}>
    <Card
      as="button"
      onClick={() => setEquipoAbierto(equipoAbierto === eq ? null : eq)}
      className="relative flex-none h-48 cursor-pointer overflow-hidden rounded-lg shadow-lg transition hover:shadow-2xl hover:ring-4 hover:ring-red-300"
    >
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${import.meta.env.BASE_URL}equipos/${eq}/${eq}.png)` }}
      />
      <div className="absolute inset-0 bg-black/40" />
      <CardContent className="relative flex items-center justify-center h-full p-4">
        <h3 className="text-3xl font-bold text-white tracking-widest uppercase">{eq}</h3>
      </CardContent>
    </Card>

    {equipoAbierto === eq && (
      <div className="col-span-full bg-white shadow-lg rounded-xl p-6 my-4">
        {/** AÑADIMOS LOS PRECIOS AQUÍ */}
    {(() => {
      const [precio1, precio2, precio3] = obtenerPrecios(eq);
      return (
        <>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-4">
  <h3 className="text-xl font-bold text-red-700 text-center sm:text-left">📋 Pagos de {eq.toUpperCase()}</h3>
  <Button
    onClick={() => descargarPendientesPDF(eq)}
     className="bg-red-500 hover:bg-red-800 text-white text-sm px-4 py-2 rounded shadow w-full sm:w-auto"
  >
    📄 Descargar listado pagos pendientes
  </Button>
</div>
        
        <div className="w-full overflow-x-auto -mx-4 sm:mx-0">
  <div className="inline-block min-w-full align-middle">
    <table className="min-w-[640px] w-full text-sm text-left text-gray-700 border mt-4">
  <thead className="bg-red-100 text-red-700 font-semibold text-center">
  <tr>
    <th className="p-2">Jugador</th>
    <th className="p-2">Pago 1<br /><span className="text-xs font-normal text-gray-600">({precio1}€)</span></th>
    <th className="p-2">Pago 2<br /><span className="text-xs font-normal text-gray-600">({precio2}€)</span></th>
    <th className="p-2">Pago 3<br /><span className="text-xs font-normal text-gray-600">({precio3}€)</span></th>
    <th className="p-2">
  Estado<br />
  <span className="text-xs font-normal text-gray-600">
    Total {precio1 + precio2 + precio3}€
  </span>
</th>
  </tr>
</thead>
  <tbody>
  {jugadoresConPagos.map(j => {
    const pagado1 = j.pago1;
    const pagado2 = j.pago2;
    const pagado3 = j.pago3;
    const completado = pagado1 && pagado2 && pagado3;

    return (
      <tr
  key={j.id}
  className={
    completado
      ? "bg-green-200 border-y-1 border-green-500 font-semibold text-green-900"
      : "bg-white"
  }
>
        <td className="p-3 font-semibold text-gray-800 text-left bg-gray-50">{j.apodo?.toUpperCase() || j.nombre}</td>
        {[pagado1, pagado2, pagado3].map((p, i) => (
          <td key={i} className="p-2">
            <button
              className={`w-full px-2 py-1 rounded text-xs font-semibold transition ${
                p
                  ? "bg-green-600 text-white hover:bg-green-700"
                  : "bg-gray-200 text-gray-800 hover:bg-gray-300"
              }`}
              onClick={() => togglePago(j.id, i, !p)}
            >
              {p ? "✓ Pagado" : "Marcar"}
            </button>
          </td>
        ))}
        <td className="p-2 font-bold">
          {completado ? "✅ Cuota pagada" : "⏳ Pendiente"}
        </td>
      </tr>
    );
  })}
</tbody>
</table></div></div></>);})()}
      </div>
    )}
  </React.Fragment>
))}
      </main>

























      <footer className="bg-gray-100 py-4">
        <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 items-center gap-4">
          <div className="text-sm text-gray-600 text-center md:text-left">
            Página diseñada y en pruebas por Mario Briones
          </div>
          <div className="flex justify-center">
            <img src={`${import.meta.env.BASE_URL}pie.png`} alt="Sello pie de página" className="h-16 w-auto" />
          </div>
          <div className="flex flex-col items-center md:items-end text-sm text-gray-700">
            <span className="font-semibold text-black-700 mb-1">🎂 Próximos cumpleaños</span>
            {proximosCumples.length === 0 ? (
              <span className="text-gray-500 italic">Sin cumpleaños cercanos</span>
            ) : (
              <ul className="flex flex-col gap-1">
                {proximosCumples.map((j, idx) => {
                  const hoy = new Date();
                  const esHoy = j.cumpleDate.getDate() === hoy.getDate() && j.cumpleDate.getMonth() === hoy.getMonth();
                  const dia = j.cumpleDate.getDate();
                  const mes = j.cumpleDate.toLocaleDateString('es-ES', { month: 'long' });
                  return (
                    <li
                      key={idx}
                      className={`text-center ${esHoy ? 'text-red-700 bg-yellow-100 px-2 py-1 rounded shadow animate-pulse' : 'text-gray-700'}`}
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