// Scout.jsx
import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem
} from '@/components/ui/select';


function slugify(nombre) {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
}

export default function Scout() {
  const { state } = useLocation();
  const usuario = state?.usuario || {};
  const navigate = useNavigate();

  const opcionesEntrenador = [
    'PLANTILLA', 'REPOSITORIO', 'METODOLOGÍA', 'PREP. FÍSICA', 'SCOUT',  
  ];
  const opcionesDirCoord = [
    'PLANTILLAS', 'REPOSITORIO', 'METODOLOGÍA', 'PREP. FÍSICA', 'SCOUT', 'CUENTAS',  
  ];
  const opcionesMenu = ['director', 'coordinador'].includes(usuario.rol)
    ? opcionesDirCoord
    : opcionesEntrenador;

  const fotoSrc = `${import.meta.env.BASE_URL}fotos/${slugify(usuario.nombre || 'avatar-blank')}.png`;
  const [proximosCumples, setProximosCumples] = useState([]);
  const [anioSeleccionado, setAnioSeleccionado] = useState('2021');
  const [jugadores, setJugadores] = useState([]);
  const [mostrarModalNuevo, setMostrarModalNuevo] = useState(false);
  const [posiciones, setPosiciones] = useState([]);
  const [jugadorSeleccionado, setJugadorSeleccionado] = useState(null);
  
const [nuevoJugador, setNuevoJugador] = useState({
  nombre: '',
  club: '',
  lateralidad: '',
  posicion: '',
  contacto: '',
  valoracion: '',
  descripcion: '',
});

useEffect(() => {
  fetch(`${import.meta.env.VITE_API_URL}/posiciones`)
    .then(res => res.json())
    .then(data => {
      if (data.success) setPosiciones(data.posiciones);
    })
    .catch(err => console.error("Error cargando posiciones:", err));
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

  useEffect(() => {
    fetch(`${import.meta.env.VITE_API_URL}/scout/${anioSeleccionado}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) setJugadores(data.jugadores);
      });
  }, [anioSeleccionado]);

const handleCrearJugador = async (e) => {
  e.preventDefault();

  // Validaciones manuales
  if (!nuevoJugador.lateralidad) {
    alert('Debes seleccionar la lateralidad');
    return;
  }
  if (!nuevoJugador.posicion) {
    alert('Debes seleccionar la posición principal');
    return;
  }
  if (!nuevoJugador.valoracion) {
    alert('Debes seleccionar la valoración');
    return;
  }

  const jugadorFinal = {
    nombre: nuevoJugador.nombre,
    club: nuevoJugador.club,
    lateralidad: nuevoJugador.lateralidad,
    posicion: nuevoJugador.posicion,
    contacto: nuevoJugador.contacto,
    valoracion: nuevoJugador.valoracion,
    descripcion: nuevoJugador.descripcion,
    anio_nacimiento: parseInt(anioSeleccionado, 10)
  };

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/scout`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jugadorFinal)
    });

    const data = await res.json();

    if (data.success) {
      alert('Jugador creado correctamente');
      setMostrarModalNuevo(false);
      setNuevoJugador({
        nombre: '',
        club: '',
        lateralidad: '',
        posicion: '',
        contacto: '',
        valoracion: '',
        descripcion: '',
      });

      const response = await fetch(`${import.meta.env.VITE_API_URL}/scout/${anioSeleccionado}`);
      const updated = await response.json();
      if (updated.success) setJugadores(updated.jugadores);
    } else {
      alert('Error al crear jugador');
    }
  } catch (err) {
    console.error('Error creando jugador:', err);
    alert('Error de red al crear jugador');
  }
};

const handleDescargarInforme = async (jugador) => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/scout/pdf`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(jugador),
    });

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `informe_${jugador.nombre_completo.replace(/\s+/g, '_')}.pdf`;
    a.click();
    window.URL.revokeObjectURL(url);
  } catch (err) {
    console.error('Error descargando informe:', err);
    alert('No se pudo generar el informe');
  }
};


const handleEliminarJugador = async (id) => {
  const confirmar = window.confirm('¿Estás seguro de que quieres eliminar este jugador en seguimiento?');
  if (!confirmar) return;

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/scout/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();

    if (data.success) {
      alert('Jugador eliminado correctamente');
      setJugadorSeleccionado(null);
      const response = await fetch(`${import.meta.env.VITE_API_URL}/scout/${anioSeleccionado}`);
      const updated = await response.json();
      if (updated.success) setJugadores(updated.jugadores);
    } else {
      alert('Error al eliminar jugador');
    }
  } catch (err) {
    console.error('Error eliminando jugador:', err);
    alert('Error de red al eliminar jugador');
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
              <p className="text-sm sm:text-base text-gray-600">Seguimiento de Jugadores</p>
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
                    className={`px-3 py-1 rounded transition ${opt === 'SCOUT' ? 'bg-gray-300 text-black' : 'text-gray-700 hover:text-white hover:bg-red-600'}`}
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

      <div className="p-4">
        <div className="flex items-center justify-center mete mb-4">
          <Select value={anioSeleccionado} onValueChange={setAnioSeleccionado}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Año nacimiento" />
            </SelectTrigger>
            <SelectContent>
              {[...Array(22)].map((_, i) => {
                const anio = 2021 - i;
                return (
                  <SelectItem key={anio} value={String(anio)}>{anio}</SelectItem>
                );
              })}
            </SelectContent>
          </Select>

          <div className="flex justify-end my-4">
  <Button
    onClick={() => setMostrarModalNuevo(true)}
    className="bg-red-600 text-white hover:bg-red-700 px-4 py-2 rounded shadow"
  >
    ➕ Nuevo Jugador en Seguimiento
  </Button>
</div>
        </div>

       <div className="space-y-2">
  {jugadores
    .sort((a, b) => (a.valoracion || '').localeCompare(b.valoracion || '')) // Ordena A, luego B, luego C
    .map(j => {
      let bgColor = 'bg-white';
      let borderColor = 'border-gray-300';
      if (j.valoracion === 'A') {
        bgColor = 'bg-green-50';
        borderColor = 'border-green-600';
      } else if (j.valoracion === 'B') {
        bgColor = 'bg-amber-50';
        borderColor = 'border-amber-500';
      } else if (j.valoracion === 'C') {
        bgColor = 'bg-red-50';
        borderColor = 'border-red-600';
      }

      return (
        <Card
          key={j.id}
          className={`flex items-center justify-between p-4 shadow ${bgColor} border-l-4 ${borderColor} cursor-pointer hover:shadow-lg transition`}
          onClick={() => setJugadorSeleccionado(j)}
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:gap-6 w-full">
            <div className="text-left w-full sm:w-1/4">
              <h3 className="text-base font-bold text-red-700 uppercase">{j.nombre_completo}</h3>
              <p className="text-sm text-gray-600">{j.club}</p>
            </div>
            <div className="text-sm text-gray-700 w-full sm:w-3/4 grid grid-cols-2 sm:grid-cols-4 gap-2">
              <p>🎯 Posición: <span className="font-medium">{j.posicion_principal}</span></p>
              <p>🦶 Lateralidad: <span className="font-medium">{j.lateralidad}</span></p>
              <p>📞 Contacto: <span className="font-medium">{j.contacto || '—'}</span></p>
              <p className="font-bold">
                Valoración: <span className="text-lg">{j.valoracion}</span>
              </p>
            </div>
          </div>
        </Card>
      );
    })}
</div>
      </div>
{mostrarModalNuevo && (
  <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center px-4">
    <div className="bg-white w-full max-w-xl rounded-lg shadow-lg p-6 relative">
      {/* Botón cerrar */}
      <button
        onClick={() => setMostrarModalNuevo(false)}
        className="absolute top-4 right-4 text-xl text-gray-600 hover:text-black"
      >
        ✖
      </button>

      <h2 className="text-xl font-bold text-red-700 mb-4 text-center">
        ➕ Nuevo Jugador en Seguimiento
      </h2>

      <form onSubmit={handleCrearJugador}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Nombre completo */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
  <input
    type="text"
    value={nuevoJugador.nombre}
    onChange={e => setNuevoJugador({ ...nuevoJugador, nombre: e.target.value })}
    className="w-full px-3 py-2 border rounded shadow-sm"
    required
  />
</div>

{/* Club actual */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Club actual *</label>
  <input
    type="text"
    value={nuevoJugador.club}
    onChange={e => setNuevoJugador({ ...nuevoJugador, club: e.target.value })}
    className="w-full px-3 py-2 border rounded shadow-sm"
    required
  />
</div>

{/* Lateralidad */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Lateralidad</label>
  <select
  value={nuevoJugador.lateralidad}
  onChange={e => setNuevoJugador({ ...nuevoJugador, lateralidad: e.target.value })}
  className="w-full px-3 py-2 border rounded shadow-sm"
>
  <option value="">-- Selecciona lateralidad --</option>
  <option value="zurdo">Zurdo</option>
  <option value="diestro">Diestro</option>
  
</select>
</div>

{/* Posición principal */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Posición principal *</label>
  <select
  value={nuevoJugador.posicion}
  onChange={e => setNuevoJugador({ ...nuevoJugador, posicion: e.target.value })}
  className="w-full px-3 py-2 border rounded shadow-sm"
  required
>
  <option value="">-- Selecciona posición --</option>
  {posiciones.map(pos => (
    <option key={pos} value={pos}>{pos}</option>
  ))}
</select>
</div>

{/* Teléfono */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono de contacto</label>
  <input
    type="tel"
    value={nuevoJugador.contacto}
    onChange={e => setNuevoJugador({ ...nuevoJugador, contacto: e.target.value })}
    className="w-full px-3 py-2 border rounded shadow-sm"
  />
</div>

{/* Valoración */}
<div>
  <label className="block text-sm font-medium text-gray-700 mb-1">Valoración *</label>
  <select
  value={nuevoJugador.valoracion}
  onChange={e => setNuevoJugador({ ...nuevoJugador, valoracion: e.target.value })}
  className="w-full px-3 py-2 border rounded shadow-sm"
  required
>
  <option value="">-- Selecciona valoración --</option>
  <option value="A">A (Muy bueno)</option>
  <option value="B">B (Bueno)</option>
  <option value="C">C (Regular)</option>
</select>
</div>

{/* Observaciones */}
<div className="sm:col-span-2">
  <label className="block text-sm font-medium text-gray-700 mb-1">Observaciones</label>
  <textarea
    rows="3"
    value={nuevoJugador.descripcion}
    onChange={e => setNuevoJugador({ ...nuevoJugador, descripcion: e.target.value })}
    className="w-full px-3 py-2 border rounded shadow-sm"
  ></textarea>
</div>
        </div>

        <div className="mt-6 flex justify-center">
          <Button type="submit" className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded">
            Guardar Jugador
          </Button>
        </div>
      </form>
    </div>
  </div>
)}


{jugadorSeleccionado && (
  <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
    <div className="relative bg-white rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-auto p-6">
    <button
      className="absolute top-2 right-3 text-2xl text-gray-500 hover:text-black z-10"
      onClick={() => setJugadorSeleccionado(null)}
    >
      ✖
    </button>

    <h2 className="text-2xl font-bold text-red-700 mb-2">{jugadorSeleccionado.nombre_completo}</h2>
    <p><strong>Club:</strong> {jugadorSeleccionado.club}</p>
    <p><strong>Posición principal:</strong> {jugadorSeleccionado.posicion_principal}</p>
    <p><strong>Lateralidad:</strong> {jugadorSeleccionado.lateralidad}</p>
    <p><strong>Teléfono:</strong> {jugadorSeleccionado.contacto || '—'}</p>
    <p><strong>Valoración:</strong> {jugadorSeleccionado.valoracion}</p>
    <p className="mt-2"><strong>Observaciones:</strong></p>
    <p className="whitespace-pre-wrap text-gray-700">{jugadorSeleccionado.descripcion || 'Sin observaciones'}</p>

    <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3">
      <Button
        className="bg-blue-600 hover:bg-blue-700 text-white"
        onClick={() => handleDescargarInforme(jugadorSeleccionado)}
      >
        📄 Descargar Informe PDF
      </Button>

      <Button
        className="bg-red-600 hover:bg-red-700 text-white"
        onClick={() => handleEliminarJugador(jugadorSeleccionado.id)}
      >
        🗑 Eliminar Jugador
      </Button>
    </div>
  </div></div>
)}




















      <footer className="bg-gray-100 py-4 mt-auto">
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