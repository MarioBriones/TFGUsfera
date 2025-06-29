// Metodologia.jsx
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

export default function Metodologia() {
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

const [reuniones, setReuniones] = useState([]);
const [mostrarFormulario, setMostrarFormulario] = useState(false);
const [nuevaReunion, setNuevaReunion] = useState({
  titulo: '',
  descripcion: '',
  fecha: '',
  archivos: []
});

  // Estructura de archivos cargados: files[semana][dia] = array de objetos { name, url, equipo }
  const [files, setFiles] = useState({});


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

 //1) CARGAR REUNIONES DESDE EL BACKEND

 useEffect(() => {
  fetch(`${import.meta.env.VITE_API_URL}/reuniones-metodologia`)
    .then(r => r.json())
    .then(data => {
      if (data.success) setReuniones(data.reuniones);
    })
    .catch(console.error);
}, [mostrarFormulario]);


  //) Borrar Reunión: 
const handleBorrarReunion = async (id) => {
  const confirmar = window.confirm("¿Estás seguro de que deseas eliminar esta reunión?");
  if (!confirmar) return;

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/reuniones-metodologia/${id}`, {
      method: 'DELETE'
    });
    const data = await res.json();
    if (!data.success) {
      console.error("❌ Error al borrar reunión", data);
    } else {
      // Actualizamos lista
      setReuniones(prev => prev.filter(r => r.id !== id));
    }
  } catch (err) {
    console.error("❌ Error de red al borrar reunión", err);
  }
};

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
              <p className="text-sm sm:text-base text-gray-600">Reuniones Metodológicas</p>
            </div>
            {/* Avatar y botón Cerrar Sesión */}
            <div className="ml-auto flex-shrink-0 flex items-center space-x-2">
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
                      (opt === 'METODOLOGÍA'
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
        {["director", "coordinador"].includes(usuario.rol) && (
  <div className="p-4 text-center">
    <Button onClick={() => setMostrarFormulario(true)}>◻️ Nueva reunión</Button>
  </div>
)}
      </header>

      {/* CONTENIDO PRINCIPAL: MAIN */}
      <main className="flex-1 overflow-auto p-6 space-y-4">
  {reuniones.map((r) => (
    <Card
  key={r.id}
  className="bg-white/80 border border-red-500 shadow-xl rounded-2xl px-6 py-4 hover:shadow-2xl transition duration-300"
>
  <div className="flex flex-col sm:grid sm:grid-cols-7 gap-4 items-start overflow-x-auto">
    {/* Columna 1: Info */}
    <div className="col-span-2 space-y-2">
  <h2 className="text-lg font-bold text-gray-800">{r.titulo}</h2>
  <p className="text-sm text-gray-500"> 
    📌 Creado por: <span className="font-semibold text-gray-700">{r.creador_nombre}</span> ({r.creador_rol}) <a className="text-sm text-gray-600">{new Date(r.fecha).toLocaleDateString()}</a>
  </p> 
  <p className="text-gray-800 text-sm">{r.descripcion}</p>

  {['director', 'coordinador'].includes(usuario.rol) && (
    <div className="pt-2">
      <Button
        size="sm"
        variant="ghost"
        onClick={() => handleBorrarReunion(r.id)}
        className="text-sm text-gray-700 hover:text-red-600"
      >
      ❌ BORRAR
      </Button>
    </div>
  )}
</div>

    {/* Columnas 2-6: Archivos (hasta 5) */}
    {Array.from({ length: 5 }).map((_, idx) => {
      const a = r.archivos?.[idx];
      return (
        <div key={idx} className="flex flex-col items-center w-full">
          {a ? (
            <>
              <embed
                src={`${import.meta.env.VITE_API_URL}/${a.ruta}#toolbar=0&navpanes=0&scrollbar=0`}
                type="application/pdf"
                className="w-full h-32 rounded border shadow object-cover"
              />
              <a
                href={`${import.meta.env.VITE_API_URL}/${a.ruta}`}
                target="_blank"
                rel="noreferrer"
                className="mt-1 text-red-700 underline text-xs text-center hover:text-red-900 transition truncate max-w-[100px]"
              >
                {a.nombre}
              </a>
            </>
          ) : (
            <div className="w-full h-32 border border-dashed border-gray-300 rounded bg-gray-50" />
          )}
        </div>
      );
    })}

  </div>
</Card>
  ))}
</main>
{mostrarFormulario && (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
    <div className="bg-white rounded-xl shadow-xl p-6 w-full max-w-lg relative space-y-4">
      <button
        className="absolute top-3 right-4 text-gray-600 text-lg hover:text-black"
        onClick={() => setMostrarFormulario(false)}
      >
        ✖
      </button>
      <h2 className="text-xl font-bold text-red-700 mb-2">📚 Nueva reunión metodológica</h2>

      <input
        type="text"
        placeholder="Título"
        value={nuevaReunion.titulo}
        onChange={e => setNuevaReunion({ ...nuevaReunion, titulo: e.target.value })}
        className="w-full border p-2 rounded"
      />
      <textarea
        placeholder="Descripción"
        value={nuevaReunion.descripcion}
        onChange={e => setNuevaReunion({ ...nuevaReunion, descripcion: e.target.value })}
        className="w-full border p-2 rounded"
        rows={3}
      />
      <input
        type="date"
        value={nuevaReunion.fecha}
        onChange={e => setNuevaReunion({ ...nuevaReunion, fecha: e.target.value })}
        className="w-full border p-2 rounded"
      />
      <div className="w-full">
  <label className="text-red-700 underline cursor-pointer block w-fit">
    Seleccionar archivos PDF, PPT, DOC o XLS.
    <input
      type="file"
      multiple
      accept=".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx"
      onChange={e => setNuevaReunion({ ...nuevaReunion, archivos: e.target.files })}
      className="hidden"
    />
  </label>
</div>

      <Button onClick={async () => {
        const formData = new FormData();
        formData.append('titulo', nuevaReunion.titulo);
        formData.append('descripcion', nuevaReunion.descripcion);
        formData.append('fecha', nuevaReunion.fecha);
        formData.append('creado_por', usuario.id);
        Array.from(nuevaReunion.archivos).forEach((file, i) => {
          formData.append('archivos', file);
        });

        const res = await fetch(`${import.meta.env.VITE_API_URL}/reuniones-metodologia`, {
          method: 'POST',
          body: formData
        });
        const data = await res.json();
        if (data.success) {
          setMostrarFormulario(false);
          setNuevaReunion({ titulo: '', descripcion: '', fecha: '', archivos: [] });
        } else {
          alert("Error al guardar");
        }
      }}>
        Guardar reunión
      </Button>
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