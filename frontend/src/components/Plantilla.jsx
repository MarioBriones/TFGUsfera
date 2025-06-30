// Plantilla.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';
import { generarPDF } from "@/utils/generarPDF";
import { generarPDFMultiple } from "@/utils/generarPDFMultiple";


// — Función auxiliar para construir el avatar — 
function slugify(nombre) {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
}

const API = import.meta.env.VITE_API_URL;
const BASE = import.meta.env.BASE_URL;

/**
 * Componente que muestra y gestiona la plantilla de un equipo.
 * @function Plantilla
 * @returns {JSX.Element} Vista con jugadores, filtros y gestión de datos
 */
export default function Plantilla() {
  const { state } = useLocation();
  const usuario = state?.usuario || {};
  const navigate = useNavigate();
  const [expandedId, setExpandedId] = useState(null);

  // Opciones de menú según rol
  const opcionesEntr = [
    'PLANTILLA',
    'REPOSITORIO',
    'METODOLOGÍA',
    'PREP. FÍSICA',
    'SCOUT',
    
  ];
  const opcionesDirC = [
    'PLANTILLAS',
    'REPOSITORIO',
    'METODOLOGÍA',
    'PREP. FÍSICA',
    'SCOUT',
    'CUENTAS',
    
  ];
  const opcionesMenu = ['director', 'coordinador'].includes(usuario.rol)
    ? opcionesDirC
    : opcionesEntr;

  // Estado principal
  const [equipos, setEquipos] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState(usuario.equipo);
  const [jugadores, setJugadores] = useState([]);

  // Modal y formularios
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    nombre_completo: '',
    apodo: '',
    fecha_dia: '',
    fecha_mes: '',
    fecha_ano: '',
    dni: '',
    seguridad_social: '',
    equipo: usuario.equipo,
    telefono: '',
    email: '',
    nacionalidad: '',
    ciudad: '',
    direccion_postal: '',
    codigo_postal: '',
    posicion_principal: '',
    posiciones_secundarias: [],
    lateralidad: '',
    imagenFile: null
  });

  // Selección múltiple
  const [selIds, setSelIds] = useState([]);
  const [bulkTeam, setBulkTeam] = useState(usuario.equipo);

  // Opciones de posición y lateralidad
  const posicionOpts = [
    'Portero',
    'Lateral Derecho',
    'Lateral Izquierdo',
    'Central',
    'Central Derecho',
    'Central Izquierdo',
    'Pivote',
    'Mediocentro',
    'Media Punta',
    'Extremo Derecho',
    'Extremo Izquierdo',
    'Punta',
    'Segundo Punta',
    'Interior Izquierdo',
    'Interior Derecho',
    'Carrilero Derecho',
    'Carrilero Izquierdo',
    'Volante Izquierdo',
    'Volante Derecho'
  ];
  const lateralidades = ['diestro', 'zurdo'];

  // Fechas para selects
  const dias = Array.from({ length: 31 }, (_, i) => i + 1);
  const meses = [
    { label: 'Enero', val: '01' },
    { label: 'Febrero', val: '02' },
    { label: 'Marzo', val: '03' },
    { label: 'Abril', val: '04' },
    { label: 'Mayo', val: '05' },
    { label: 'Junio', val: '06' },
    { label: 'Julio', val: '07' },
    { label: 'Agosto', val: '08' },
    { label: 'Septiembre', val: '09' },
    { label: 'Octubre', val: '10' },
    { label: 'Noviembre', val: '11' },
    { label: 'Diciembre', val: '12' }
  ];
  const currentYear = new Date().getFullYear();
  const years = Array.from(
    { length: currentYear - 1980 + 1 },
    (_, i) => currentYear - i
  );

  const fotoSrc = `${BASE}fotos/${slugify(usuario.nombre || 'avatar-blank')}.png`;

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

  // Cargar equipos (solo director/coordinador)
  useEffect(() => {
    if (['director', 'coordinador'].includes(usuario.rol)) {
      fetch(`${API}/equipos`)
        .then((r) => r.json())
        .then((data) => {
          if (data.success) {
            const lista = Array.from(
    new Set(
    data.equipos
      .filter((e) => e !== 'nada')
      .map((e) => e.toLowerCase())
  )
);

setEquipos(['todo', ...lista.filter((e) => e !== 'todo')]);
          }
        })
        .catch(console.error);
    } else {
  fetch(`${API}/equipos`)
    .then((r) => r.json())
    .then((data) => {
      if (data.success) {
        const equipoUsuario = usuario.equipo.toLowerCase();
        const base = equipoUsuario.replace(/[abc]$/, '');

        const filtrados = data.equipos
          .map((e) => e.toLowerCase())
          .filter((e) =>
            e.startsWith(base) && !['todo', 'nada'].includes(e)
          );

        setEquipos(filtrados);
        setSelectedTeam(equipoUsuario);
      }
    })
    .catch(console.error);
}
  }, [usuario.rol, usuario.equipo]);

  // Cargar jugadores al cambiar equipo
  useEffect(() => {
    const eq = selectedTeam === 'todo' ? 'todo' : selectedTeam;
    fetch(`${API}/jugadores/${eq}`)
      .then((r) => r.json())
      .then((d) => d.success && setJugadores(d.jugadores))
      .catch(console.error);
  }, [selectedTeam]);

/**
 * Guarda o actualiza los datos de un jugador.
 * @function saveJugador
 * @param {object} jugador - Objeto con los datos del jugador
 * @returns {Promise<void>}
 */
  const saveJugador = async () => {
    if (!form.fecha_dia || !form.fecha_mes || !form.fecha_ano) {
      alert('Debes elegir día, mes y año de nacimiento');
      return;
    }

    const formData = new FormData();
    formData.append('nombre_completo', form.nombre_completo);
    formData.append('apodo', form.apodo);
    const dia = form.fecha_dia.toString().padStart(2, '0');
    const mes = form.fecha_mes.toString().padStart(2, '0');
    const ano = form.fecha_ano;
    formData.append('fecha_nacimiento', `${ano}-${mes}-${dia}`);
    formData.append('dni', form.dni);
    formData.append('seguridad_social', form.seguridad_social);
    formData.append('equipo', form.equipo);
    formData.append('telefono', form.telefono);
    formData.append('email', form.email);
    formData.append('nacionalidad', form.nacionalidad);
    formData.append('ciudad', form.ciudad);
    formData.append('direccion_postal', form.direccion_postal);
    formData.append('codigo_postal', form.codigo_postal);
    formData.append('posicion_principal', form.posicion_principal);
    formData.append(
      'posiciones_secundarias',
      JSON.stringify(form.posiciones_secundarias || [])
    );
    formData.append('lateralidad', form.lateralidad);

    if (form.imagenFile) {
      formData.append('imagen', form.imagenFile);
    }

    const url = editingId
      ? `${API}/jugadores/${editingId}`
      : `${API}/jugadores`;
    const method = editingId ? 'PATCH' : 'POST';

    const res = await fetch(url, { method, body: formData });
    const data = await res.json();
    if (!data.success) {
      return alert('Error al guardar jugador');
    }

    setModalOpen(false);
    setEditingId(null);
    setForm({
      nombre_completo: '',
      apodo: '',
      fecha_dia: '',
      fecha_mes: '',
      fecha_ano: '',
      dni: '',
      seguridad_social: '',
      equipo: usuario.equipo,
      telefono: '',
      email: '',
      nacionalidad: '',
      ciudad: '',
      direccion_postal: '',
      codigo_postal: '',
      posicion_principal: '',
      posiciones_secundarias: [],
      lateralidad: '',
      imagenFile: null
    });
    const equipoParaCargar = selectedTeam || usuario.equipo;
    fetch(`${API}/jugadores/${equipoParaCargar}`)
      .then((r) => r.json())
      .then((d) => d.success && setJugadores(d.jugadores))
      .catch(console.error);
  };

/**
 * Elimina un jugador del sistema y borra su información.
 * @function deleteOne
 * @async
 * @param {number} id - ID del jugador a eliminar
 * @returns {Promise<void>} Resultado de la eliminación
 */
  const deleteOne = async (id) => {
    if (!window.confirm('¿Borrar este jugador?')) return;
    await fetch(`${API}/jugadores/${id}`, { method: 'DELETE' });
    setJugadores((js) => js.filter((j) => j.id !== id));
  };

  /**
 * Mueve múltiples jugadores a otro equipo.
 * @function moveBulk
 * @async
 * @param {string} destino - Nombre del equipo de destino
 * @returns {Promise<void>}
 */
  const moveBulk = async () => {
  if (!bulkTeam || bulkTeam === "todo" || bulkTeam === "nada") {
    alert("Selecciona un equipo válido al que mover.");
    return;
  }

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/jugadores-mover-masivo`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selIds, nuevoEquipo: bulkTeam }),
    });

    const data = await res.json();

    if (!res.ok || !data.success) {
      alert("❌ Error al mover jugadores.");
      return;
    }

    alert(`✅ ${selIds.length} jugador(es) movido(s) a ${bulkTeam.toUpperCase()}`);
    setSelIds([]);
    setBulkTeam("");
    
    // ⚠️ Asegúrate de que esta función no lanza error si no hay jugadores o selectedTeam es null
    try {
      const eq = selectedTeam === "todo" ? "todo" : selectedTeam;
      const recarga = await fetch(`${import.meta.env.VITE_API_URL}/jugadores/${eq}`);
      const datos = await recarga.json();
      if (datos.success) setJugadores(datos.jugadores);
    } catch (e) {
      console.warn("⚠️ Fallo recargando jugadores:", e);
    }

  } catch (err) {
    console.error("❌ Error en la solicitud:", err);
    alert("❌ Error en la solicitud.");
  }
};

  return (
    <div
      className="relative flex flex-col min-h-screen bg-cover bg-center "
      style={{
        backgroundImage: `url(${import.meta.env.BASE_URL}fondo2.png)`,
      }}
    >
      {/* Overlay suave para atenuar la imagen */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />
      {/* HEADER FIJO */}
      <header className="sticky top-0 z-50">
        <div className="h-1 bg-gray-400 w-full" />
        <div className="bg-gray-200">
          <div className="relative flex items-center justify-between w-full px-4 sm:px-6 lg:px-8 py-3">
            <img
              src={`${BASE}logo.png`}
              alt="Escudo Unionistas"
              className="h-12 w-12 cursor-pointer flex-shrink-0"
              onClick={() =>
                navigate('/home', { state: { usuario } })
              }
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
              <h1
                className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 cursor-pointer hover:text-red-600 transition pointer-events-auto"
                onClick={() =>
                  navigate('/home', { state: { usuario } })
                }
              >
                USFERA
              </h1>
              <p className="text-sm sm:text-base text-gray-600">
                Plantilla
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <img
                src={fotoSrc}
                alt={`Avatar de ${usuario.nombre}`}
                className="h-8 w-8 rounded-full object-cover border-2 border-white shadow-sm hidden sm:inline-block"
                onError={(e) =>
                  (e.currentTarget.src = `${BASE}fotos/avatar-blank.png`)
                }
              />
              <Button
                variant="outline"
                className="bg-transparent border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition"
                onClick={() =>
                  navigate('/', { state: { usuario } })
                }
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
              {opcionesMenu.map((opt) => (
                <li key={opt}>
                  <button
                    onClick={() =>
                      navigate(`/${opt.toLowerCase().replace(/\s+/g, '')}`, {
                        state: { usuario }
                      })
                    }
                    className={
                      `px-3 py-1 text-gray-700 hover:text-white hover:bg-red-600 rounded transition ` +
                      (opt === 'PLANTILLA' || opt === 'PLANTILLAS'
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
        <div className="h-1 bg-red-600 w-full" />

        
      </header>

      {/* BANNER */}
      <div
        className="w-full h-44 bg-cover bg-center flex items-center justify-center relative text-white text-5xl font-extrabold tracking-widest uppercase"
        style={{
        backgroundImage: `url(/equipos/${selectedTeam}/${selectedTeam}.png)`
      }}>

  {/* Capa negra elegante sin blur */}
  <div className="absolute inset-0 bg-black/30" />

  {/* Nombre del equipo */}
  <span className="relative z-10 drop-shadow-lg">{selectedTeam}</span>
  </div>


     <main className="flex-grow overflow-auto p-4 pb-32 bg-gradient-to-b from-red-50 to-white/90">
  {/* CABECERA DE ACCIONES */}
  <div className="p-4 flex flex-wrap items-center justify-center gap-3 bg-white/60 rounded-xl shadow">
    
    {/* SELECTOR DE EQUIPO GLOBAL */}
    {['director', 'coordinador'].includes(usuario.rol) && (
      <div className="bg-red-50 p-2 rounded shadow">
        <Select
          value={selectedTeam}
          onValueChange={(v) => setSelectedTeam(v)}
        >
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Selecciona equipo" />
          </SelectTrigger>
          <SelectContent>
            {equipos.map((eq) => (
              <SelectItem key={eq} value={eq}>
                {eq.toUpperCase()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    )}

    {/* NUEVO JUGADOR */}
    <Button
      onClick={() => {
        setModalOpen(true);
        setEditingId(null);
        setForm((prev) => ({
          ...prev,
          equipo: selectedTeam,
          posiciones_secundarias: []
        }));
      }}
    >
      ➕ Nuevo jugador
    </Button>

    {/* SELECCIONAR TODOS / DESELECCIONAR */}
    <Button
      variant="outline"
      onClick={() => {
        if (selIds.length === jugadores.length) {
          setSelIds([]);
        } else {
          setSelIds(jugadores.map((j) => j.id));
        }
      }}
    >
      {selIds.length === jugadores.length ? "❌ Deseleccionar todos" : "✅ Seleccionar todos"}
    </Button>

    {/* OPCIONES MASIVAS */}
    {selIds.length > 0 && (
      <>
        {/* TÍTULO + SELECTOR DESTINO */}
        <div className="flex flex-col items-center">
          <span className="text-sm font-semibold text-gray-700 mb-1">
            Equipo al que mover
          </span>
          <Select
            value={bulkTeam}
            onValueChange={(v) => setBulkTeam(v)}
          >
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Mover a..." />
            </SelectTrigger>
            <SelectContent>
        {equipos.map((eq) => (
        <SelectItem key={eq} value={eq}>
        {eq.toUpperCase()}
        </SelectItem>
        ))}
        </SelectContent>
          </Select>
        </div>

        {/* BOTÓN MOVER */}
        <Button variant="outline" onClick={moveBulk}>
          🔁 Mover {selIds.length}
        </Button>

        {/* BOTÓN DESCARGAR PDF */}
        <Button
          className="bg-green-600 hover:bg-green-700 text-white font-bold"
          onClick={() => {
            const seleccionados = jugadores.filter(j => selIds.includes(j.id));
            if (seleccionados.length > 0) {
              generarPDFMultiple(seleccionados);
            }
          }}
        >
          📄 Descargar PDF de {selIds.length} jugador{selIds.length > 1 ? 'es' : ''}
        </Button>
      </>
    )}
  </div>

  {/* GRID DE JUGADORES */}
<div className="mt-6 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
  {jugadores.map((j) => (
    <React.Fragment key={j.id}>
      <Card
        key={j.id}
        className="relative flex flex-col lg:flex-row rounded-xl border-slate-300 bg-white/30 backdrop-blur-md shadow-inner transition-all duration-300 ease-in-out hover:scale-[1.02] hover:shadow-2xl hover:ring-1 hover:ring-red-300"
      >
        {/* BLOQUE IZQUIERDO: IMAGEN */}
        <div className="flex flex-col lg:flex-row w-full">
          <div className="w-full lg:w-32 h-48 lg:h-auto bg-gradient-to-b from-slate-200 to-slate-100 flex-shrink-0 mb-3 lg:mb-0">
            <img
              src={
                j.imagen
                  ? `${API}${j.imagen}`
                  : `${BASE}fotos/avatar-blank.png`
              }
              alt={`Foto de ${j.nombre_completo}`}
              className="w-full h-full object-cover object-top"
            />
          </div>

          {/* CONTENIDO */}
          <div className="flex flex-col flex-grow p-4">
            {/* APODO + CHECKBOX */}
            <div className="w-full flex items-center justify-center mb-2 space-x-3">
              {/* Checkbox un poco más grande y con buen contraste */}
              <input
                type="checkbox"
                checked={selIds.includes(j.id)}
                onChange={(e) =>
                  setSelIds((ids) =>
                    e.target.checked
                      ? [...ids, j.id]
                      : ids.filter((x) => x !== j.id)
                  )
                }
                className="w-6 h-6 accent-red-600 shadow-sm rounded"
              />
              <h2 className="text-xl font-extrabold tracking-widest uppercase text-red-800 drop-shadow">
                {j.apodo}
              </h2>
            </div>

            {/* DATOS */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm sm:text-base text-slate-800">
              {[
                ['Nombre', j.nombre_completo],
                ['DNI', j.dni],
                ['Seg. Social', j.seguridad_social],
                ['Email', j.email],
                ['Teléfono', j.telefono],
                ['Fecha nac.', new Date(j.fecha_nacimiento).toLocaleDateString()],
                ['Posición', j.posicion_principal],
                ['Lateralidad', j.lateralidad],
                ['Equipo', j.equipo],
                ['Ciudad', j.ciudad],
                ['Dirección', j.direccion_postal],
                ['Cód. Postal', j.codigo_postal],
              ].map(([label, value]) => (
                <p key={label}>
                  <span className="text-slate-500 font-medium">{label}:</span>{' '}
                  <span className="uppercase font-semibold text-slate-900 tracking-wide">
                    {value}
                  </span>
                </p>
              ))}
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="mt-4 flex justify-end space-x-2">
              <Button
                size="icon"
                onClick={() =>
                  setExpandedId((prev) => (prev === j.id ? null : j.id))
                }
                className="bg-blue-600 hover:bg-blue-700 text-white shadow"
              >
                👁️
              </Button>

              <Button
                size="icon"
                onClick={() => {
                  setEditingId(j.id);
                  const [ano, mes, dia] = j.fecha_nacimiento.split('-');
                  setForm({
                    ...j,
                    fecha_dia: parseInt(dia, 10),
                    fecha_mes: mes,
                    fecha_ano: ano,
                    posiciones_secundarias: j.posiciones_secundarias || [],
                    imagenFile: null,
                  });
                  setModalOpen(true);
                }}
                className="bg-yellow-400 hover:bg-yellow-500 text-white shadow"
              >
                ✏️
              </Button>

              <Button
                size="icon"
                variant="destructive"
                onClick={() => deleteOne(j.id)}
                className="shadow"
              >
                🗑️
              </Button>
            </div>
          </div>
        </div>
      </Card>

          {/* PANEL SUPERPUESTO GRANDE */}
{expandedId && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center">
  <div className="bg-white w-full max-w-6xl rounded-xl shadow-lg p-6 relative overflow-y-auto max-h-[90vh] animate-fadeZoomIn">
      
      {/* BOTÓN CERRAR */}
      <button
        onClick={() => setExpandedId(null)}
        className="absolute top-4 right-4 text-gray-600 hover:text-black text-2xl font-bold"
      >
        ✖
      </button>

      {/* DATOS DEL JUGADOR */}
      {(() => {
        const jugador = jugadores.find((j) => j.id === expandedId);
        if (!jugador) return null;

        return (
          <div className="flex flex-col lg:flex-row gap-6 items-center justify-between">
  {/* FOTO JUGADOR */}
  <div className="flex-1 flex justify-center">
    <img
      src={jugador.imagen ? `${API}${jugador.imagen}` : `${BASE}fotos/avatar-blank.png`}
      alt="Foto del jugador"
      className="w-72 h-72 md:w-80 md:h-80 object-cover rounded-xl border shadow"
    />
  </div>

  {/* DATOS GRANDES */}
  <div className="flex-1 text-center">
    <h3 className="text-2xl font-bold text-red-700 uppercase mb-4">
      {jugador.apodo} – {jugador.nombre_completo}
    </h3>
    <ul className="space-y-1 text-base text-left inline-block">
      <li><strong>DNI:</strong> {jugador.dni}</li>
      <li><strong>Seguridad Social:</strong> {jugador.seguridad_social}</li>
      <li><strong>Teléfono:</strong> {jugador.telefono}</li>
      <li><strong>Email:</strong> {jugador.email}</li>
      <li><strong>Fecha nacimiento:</strong> {new Date(jugador.fecha_nacimiento).toLocaleDateString()}</li>
      <li><strong>Ciudad:</strong> {jugador.ciudad}</li>
      <li><strong>Dirección:</strong> {jugador.direccion_postal}</li>
      <li><strong>Código Postal:</strong> {jugador.codigo_postal}</li>
      <li><strong>Equipo:</strong> {jugador.equipo}</li>
      <li><strong>Posición:</strong> {jugador.posicion_principal}</li>
      <li><strong>Lateralidad:</strong> {jugador.lateralidad}</li>
    </ul>

      <div className="mt-6">
      <Button onClick={() => generarPDF(jugador)}>📄 Descargar PDF</Button>
      </div>
    </div>

    {/* CROQUIS POSICIÓN */}
    <div className="flex-1 flex justify-center">
      <img
        src={`/posiciones/${slugify(jugador.posicion_principal)}.png`}
        alt="Croquis posición"
        className="w-72 h-72 md:w-80 md:h-80 object-contain rounded border shadow"
        onError={(e) => (e.currentTarget.style.display = 'none')}
      />
    </div>
  </div>
  );
  })()}
  </div>
</div>
)}
</React.Fragment>
))}
</div>
</main>
      


      {/* MODAL DE ALTA / EDICIÓN */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded shadow-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4">
              {editingId ? 'Editar jugador' : 'Nuevo jugador'}
            </h2>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveJugador();
              }}
              className="space-y-3"
            >
              <label className="block">
                Nombre completo *
                <Input
                  required
                  value={form.nombre_completo || ''}
                  onChange={(e) =>
                    setForm((f) => ({
                      ...f,
                      nombre_completo: e.target.value
                    }))
                  }
                />
              </label>
              <label className="block">
                Apodo *
                <Input
                  required
                  value={form.apodo || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, apodo: e.target.value }))
                  }
                />
              </label>
              <label className="block">
                Fecha nacimiento *
                <div className="flex space-x-2 mt-1">
                  <select
                    value={form.fecha_dia}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fecha_dia: e.target.value }))
                    }
                    required
                  >
                    <option value="">Día</option>
                    {dias.map((d) => (
                      <option key={d} value={d}>
                        {d}
                      </option>
                    ))}
                  </select>
                  <select
                    value={form.fecha_mes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fecha_mes: e.target.value }))
                    }
                    required
                  >
                    <option value="">Mes</option>
                    {meses.map((m) => (
                      <option key={m.val} value={m.val}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                  <select
                    value={form.fecha_ano}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fecha_ano: e.target.value }))
                    }
                    required
                  >
                    <option value="">Año</option>
                    {years.map((y) => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </label>
              <label className="block">
                DNI *
                <Input
                  required
                  value={form.dni || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, dni: e.target.value }))
                  }
                />
              </label>
              <label className="block relative">
  <span className="flex items-center space-x-2">
    <span>Tarjeta Seguridad Social *</span>
    <span
      className="text-blue-600 cursor-help"
      title="Nº que empieza por CYL en SACYL o Nº + Aseguradora en caso de seguro privado o que no es de Castilla y León"
    >
      ℹ️
    </span>
  </span>
  <Input
    required
    value={form.seguridad_social || ''}
    onChange={(e) =>
      setForm((f) => ({ ...f, seguridad_social: e.target.value }))
    }
    className="mt-1"
  />
</label>
              <label className="block">
                Equipo *
                <Select
                  required
                  value={form.equipo || ''}
                  onValueChange={(v) => setForm((f) => ({ ...f, equipo: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona equipo" />
                  </SelectTrigger>
                  <SelectContent>
  {equipos
    .filter((eq) => eq !== 'todo') // ⛔️ quitamos 'todo' como opción
    .map((eq) => (
      <SelectItem key={eq} value={eq}>
        {eq.toUpperCase()}
      </SelectItem>
    ))}
</SelectContent>
                </Select>
              </label>
              <label className="block">
                Teléfono *
                <Input
                  required
                  type="tel"
                  value={form.telefono || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, telefono: e.target.value }))
                  }
                />
              </label>
              <label className="block">
                Email *
                <Input
                  required
                  type="email"
                  value={form.email || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, email: e.target.value }))
                  }
                />
              </label>
              <label className="block">
                Nacionalidad *
                <Input
                  required
                  value={form.nacionalidad || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nacionalidad: e.target.value }))
                  }
                />
              </label>
              <label className="block">
                Ciudad *
                <Input
                  required
                  value={form.ciudad || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, ciudad: e.target.value }))
                  }
                />
              </label>
              <label className="block">
                Dirección postal *
                <Input
                  required
                  value={form.direccion_postal || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, direccion_postal: e.target.value }))
                  }
                />
              </label>
              <label className="block">
                Código postal *
                <Input
                  required
                  value={form.codigo_postal || ''}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, codigo_postal: e.target.value }))
                  }
                />
              </label>
              <div className="block">
                <span>Posición principal *</span>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {posicionOpts.map((p) => (
                    <label key={p} className="inline-flex items-center">
                      <input
                        type="radio"
                        name="posicion_principal"
                        value={p}
                        checked={form.posicion_principal === p}
                        onChange={() =>
                          setForm((f) => ({ ...f, posicion_principal: p }))
                        }
                      />
                      <span className="ml-2 text-sm">{p}</span>
                    </label>
                  ))}
                </div>
              </div>
              <label className="block">
                Lateralidad *
                <Select
                  required
                  value={form.lateralidad || ''}
                  onValueChange={(v) => setForm((f) => ({ ...f, lateralidad: v }))}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona lateralidad" />
                  </SelectTrigger>
                  <SelectContent>
                    {lateralidades.map((lat) => (
                      <SelectItem key={lat} value={lat}>
                        {lat.charAt(0).toUpperCase() + lat.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </label>
              <div className="block">
  <label className="font-medium text-sm text-gray-700">Imagen del jugador (.png/.jpeg)</label>
  <div className="mt-2">
    <label
      htmlFor="fileUpload"
      className="cursor-pointer inline-flex items-center space-x-2 text-blue-600 hover:text-blue-800 underline"
    >
      <span>➡️ SELECCIONAR ARCHIVO DE IMAGEN</span>
    </label>
    <input
      id="fileUpload"
      type="file"
      accept="image/*"
      className="hidden"
      onChange={(e) => {
        const file = e.target.files?.[0];
        setForm((f) => ({ ...f, imagenFile: file }));
      }}
    />
  </div>
  {form.imagenFile && (
    <p className="text-sm mt-1 text-green-700">
      Archivo seleccionado: <strong>{form.imagenFile.name}</strong>
    </p>
  )}
</div>

              <div className="mt-4 flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setModalOpen(false);
                    setEditingId(null);
                    setForm({
                      nombre_completo: '',
                      apodo: '',
                      fecha_dia: '',
                      fecha_mes: '',
                      fecha_ano: '',
                      dni: '',
                      seguridad_social: '',
                      equipo: usuario.equipo,
                      telefono: '',
                      email: '',
                      nacionalidad: '',
                      ciudad: '',
                      direccion_postal: '',
                      codigo_postal: '',
                      posicion_principal: '',
                      posiciones_secundarias: [],
                      lateralidad: '',
                      imagenFile: null
                    });
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingId ? 'Guardar cambios' : 'Crear jugador'}
                </Button>
              </div>
            </form>
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