// Inicio.jsx
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
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from '@/components/ui/select';


// Helper para crear slugs a partir del nombre
function slugify(nombre) {
  return nombre
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^\w-]/g, '');
}

export default function Inicio() {
  const { state } = useLocation();
  const usuario = state?.usuario || {};
  const navigate = useNavigate();

  // ——— Menú horizontal según rol ———
  const opcionesEntrenador = [
    'PLANTILLA',
    'REPOSITORIO',
    'METODOLOGÍA',
    'PREP. FÍSICA',
    'SCOUT',
    
  ];
  const opcionesDirCoord = [
    'PLANTILLAS',
    'REPOSITORIO',
    'METODOLOGÍA',
    'PREP. FÍSICA',
    'SCOUT',
    'CUENTAS',
    
  ];
  const opcionesMenu = ['director', 'coordinador'].includes(usuario.rol)
    ? opcionesDirCoord
    : opcionesEntrenador;

  // ——— Accesos directos de la columna derecha ———
  const principalesPorRol = {
    director: ['Jugadores', 'Estadísticas'],
    coordinador: ['Entrenamientos', 'Documentos'],
    entrenador: ['Jugadores', 'Pagos & Ropa'],
  };
  const principales = principalesPorRol[usuario.rol] || [];

  // ——— Estado de la agenda de tareas ———
  const [tareas, setTareas] = useState([]);
  const [tareasCreadas, setTareasCreadas] = useState([]);
  const [nuevaDesc, setNuevaDesc] = useState('');
  const [nuevaFecha, setNuevaFecha] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [nuevoAsignado, setNuevoAsignado] = useState(usuario.id);

  const hoy = new Date().toISOString().split('T')[0];
  const fotoSrc = `${import.meta.env.BASE_URL}fotos/${slugify(
    usuario.nombre || 'avatar-blank'
  )}.png`;

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

  // ——— 1) Carga inicial de tareas (para mí y las que creé) ———
  useEffect(() => {
    if (!usuario.id) return;
    Promise.all([
      fetch(
        `${import.meta.env.VITE_API_URL}/tareas/${usuario.id}`
      ).then((r) => r.json()),
      fetch(
        `${import.meta.env.VITE_API_URL}/tareas/creadas/${usuario.id}`
      ).then((r) => r.json()),
    ])
      .then(([asig, creadas]) => {
        if (asig.success) setTareas(asig.tareas);
        if (creadas.success) setTareasCreadas(creadas.tareas);
      })
      .catch(console.error);
  }, [usuario.id]);

  // ——— 2) Carga select de usuarios (solo director/coordinador) ———
  useEffect(() => {
    if (!['director', 'coordinador'].includes(usuario.rol)) return;
    Promise.all([
      fetch(
        `${import.meta.env.VITE_API_URL}/usuarios?rol=entrenador`
      ).then((r) => r.json()),
      fetch(
        `${import.meta.env.VITE_API_URL}/usuarios?rol=coordinador`
      ).then((r) => r.json()),
    ])
      .then(([eData, cData]) => {
        if (eData.success && cData.success) {
          const merged = [...eData.usuarios, ...cData.usuarios];
          const unique = merged.filter(
            (u, i, a) => a.findIndex((x) => x.id === u.id) === i
          );
          const others = unique.filter((u) => u.id !== usuario.id);
          setUsuarios([{ id: usuario.id, nombre: `${usuario.nombre} (yo)` }, ...others]);
          setNuevoAsignado(usuario.id);
        }
      })
      .catch(console.error);
  }, [usuario.rol, usuario.id, usuario.nombre]);

  // ——— 3) Crear nueva tarea ———
  const crearTarea = async () => {
    if (!nuevaDesc) return;
    const res = await fetch(`${import.meta.env.VITE_API_URL}/tareas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        descripcion: nuevaDesc,
        creado_por: usuario.id,
        asignado_para: nuevoAsignado,
        limite: nuevaFecha || null,
      }),
    });
    const json = await res.json();
    if (!json.success) return;

    // Enriquecer tarea sin recargar toda la lista
    const asignado =
      usuarios.find((u) => u.id === nuevoAsignado)?.nombre ||
      usuario.nombre;
    const nueva = {
      ...json.tarea,
      creado_por_nombre: usuario.nombre,
      asignado_a_nombre: asignado,
    };
    if (nuevoAsignado === usuario.id) setTareas((prev) => [nueva, ...prev]);
    else setTareasCreadas((prev) => [nueva, ...prev]);

    setNuevaDesc('');
    setNuevaFecha('');
  };

  // ——— 4) Marcar/desmarcar completada ———
  const toggleCompletada = async (id, actual) => {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/tareas/${id}`,
      {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completado: !actual }),
      }
    );
    const { success, tarea } = await res.json();
    if (!success) return;
    const update = (list) =>
      list.map((t) =>
        t.id === id
          ? { ...t, completado: tarea.completado, limite: tarea.limite }
          : t
      );
    setTareas(update);
    setTareasCreadas(update);
  };

  // ——— 5) Eliminar tarea completada ———
  const eliminarTarea = async (id) => {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/tareas/${id}`,
      { method: 'DELETE' }
    );
    const json = await res.json();
    if (!json.success) return;
    setTareas((prev) => prev.filter((t) => t.id !== id));
    setTareasCreadas((prev) => prev.filter((t) => t.id !== id));
  };

  return (
    <div
      className="relative flex flex-col min-h-screen bg-cover bg-center"
      style={{
        backgroundImage: `url(${import.meta.env.BASE_URL}fondo2.png)`,
      }}
    >
      {/* Overlay suave para atenuar la imagen */}
      <div className="absolute inset-0 bg-black/10 pointer-events-none" />

      {/* ——— HEADER FIJO ——— */}
      <header className="sticky top-0 z-50">
        {/* Línea superior gris */}
        <div className="h-1 bg-gray-400 w-full" />

        {/* Franja principal */}
        <div className="bg-gray-200">
          <div className="relative flex items-center justify-between w-full px-4 sm:px-6 lg:px-8 py-3">
            {/* Logo a la izquierda */}
            <img
              src={`${import.meta.env.BASE_URL}logo.png`}
              alt="Escudo Unionistas"
              className="h-12 w-12 cursor-pointer flex-shrink-0"
              onClick={() =>
                navigate('/home', { state: { usuario } })
              }
            />

            {/* Título + subtítulo centrados */}
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none px-4">
              <h1
                className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-800 cursor-pointer hover:text-red-600 transition pointer-events-auto"
                onClick={() =>
                  navigate('/home', { state: { usuario } })
                }
              >
                USFERA
              </h1>
              <p className="hidden sm:block text-sm sm:text-base text-gray-600">
                Gestión y administración – Cantera de Unionistas de Salamanca CF
              </p>
            </div>

            {/* Botón cerrar sesión a la derecha */}
            <div className="flex-shrink-0">
              <Button
                variant="outline"
                className="bg-transparent border-red-600 text-red-600 hover:bg-red-600 hover:text-white transition"
                onClick={() => navigate('/')}
              >
                Cerrar Sesión
              </Button>
            </div>
          </div>
        </div>

        {/* Línea fina */}
        <div className="h-px bg-gray-400 w-full" />

        {/* Menú secundario */}
        <div className="bg-red-50">
          <nav className="w-full max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
            <ul className="flex flex-wrap justify-center gap-2 sm:gap-4 py-2 text-sm">
              {opcionesMenu.map((opt) => (
                <li key={opt}>
                  <button
                    onClick={() =>
                      navigate(
                        `/${opt.toLowerCase().replace(/\s+/g, '')}`,
                        { state: { usuario } }
                      )
                    }
                    className="px-3 py-1 text-gray-700 hover:text-white hover:bg-red-600 rounded transition"
                  >
                    {opt}
                  </button>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Línea divisoria roja */}
        <div className="h-1 bg-red-600 w-full" />
      </header>

      {/* ——— MAIN CONTENT ——— */}
      <main className="relative flex-1 w-full px-4 sm:px-6 lg:px-8 py-6 bg-gradient-to-b from-red-50 to-white/90 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pb-24">
        {/* AGENDA — ocupa 70vh */}
        <Card className="w-full bg-white/50 backdrop-blur-sm col-span-full lg:col-span-2 h-[70vh] overflow-auto">
          <CardHeader>
            <CardTitle>Tu Agenda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Formulario de nueva tarea */}
            <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-4">
              {/* Descripción */}
              <div className="md:col-span-3">
                <label htmlFor="desc" className="text-sm font-medium">
                  Descripción
                </label>
                <Input
                  id="desc"
                  placeholder="Describe tu tarea…"
                  value={nuevaDesc}
                  onChange={(e) => setNuevaDesc(e.target.value)}
                />
              </div>
              {/* Fecha límite */}
              <div className="md:col-span-1">
                <label htmlFor="limite" className="text-sm font-medium">
                  Fecha límite
                </label>
                <Input
                  id="limite"
                  type="date"
                  min={hoy}
                  value={nuevaFecha}
                  onChange={(e) => setNuevaFecha(e.target.value)}
                />
              </div>
              {/* Select usuarios */}
              <div className="md:col-span-1">
                <label htmlFor="asignado" className="text-sm font-medium">
                  Asignar a:{' '}
                </label>
                {['director', 'coordinador'].includes(usuario.rol) ? (
                  <Select
                    id="asignado"
                    value={String(nuevoAsignado)}
                    onValueChange={(v) => setNuevoAsignado(Number(v))}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Usuario" />
                    </SelectTrigger>
                    <SelectContent>
                      {usuarios.map((u) => (
                        <SelectItem key={u.id} value={String(u.id)}>
                          {u.nombre}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <span className="pt-2">{usuario.nombre}</span>
                )}
              </div>
              {/* Botón Añadir */}
              <div className="md:col-span-1 flex items-end">
                <Button onClick={crearTarea}>Añadir tarea</Button>
              </div>
            </div>

            {/* Listas separadas */}
            <div
              className={`grid grid-cols-1 ${
                usuario.rol !== 'entrenador' ? 'md:grid-cols-2' : ''
              } gap-6`}
            >
              {/* Mis tareas */}
              <Card className="w-full max-h-[60vh] overflow-auto">
                <CardHeader>
                  <CardTitle>Mis tareas</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {tareas.map((t) => (
                    <div
                      key={t.id}
                      className="p-4 bg-white rounded shadow flex justify-between"
                    >
                      <div>
                        <p
                          className={
                            t.completado
                              ? 'line-through text-gray-500'
                              : ''
                          }
                        >
                          {t.descripcion}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          Límite:{' '}
                          {t.limite
                            ? new Date(t.limite).toLocaleDateString()
                            : 'Sin límite'}{' '}
                          • Creada por: {t.creado_por_nombre} • Asignada a:{' '}
                          {t.asignado_a_nombre}
                        </p>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="icon"
                          variant={t.completado ? 'destructive' : 'outline'}
                          onClick={() =>
                            toggleCompletada(t.id, t.completado)
                          }
                        >
                          {t.completado ? '✓' : '○'}
                        </Button>
                        {t.completado && (
                          <Button
                            size="icon"
                            variant="destructive"
                            onClick={() => eliminarTarea(t.id)}
                          >
                            🗑️
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Tareas que asigné */}
              {usuario.rol !== 'entrenador' && (
                <Card className="w-full max-h-[60vh] overflow-auto">
                  <CardHeader>
                    <CardTitle>Tareas que asigné</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {tareasCreadas.map((t) => (
                      <div
                        key={t.id}
                        className="p-4 bg-white rounded shadow flex justify-between"
                      >
                        <div>
                          <p
                            className={
                              t.completado
                                ? 'line-through text-gray-500'
                                : ''
                            }
                          >
                            {t.descripcion}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            Límite:{' '}
                            {t.limite
                              ? new Date(t.limite).toLocaleDateString()
                              : 'Sin límite'}{' '}
                            • Creada por: {t.creado_por_nombre} • Asignada a:{' '}
                            {t.asignado_a_nombre}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="icon"
                            variant={t.completado ? 'destructive' : 'outline'}
                            onClick={() =>
                              toggleCompletada(t.id, t.completado)
                            }
                          >
                            {t.completado ? '✓' : '○'}
                          </Button>
                          {t.completado && (
                            <Button
                              size="icon"
                              variant="destructive"
                              onClick={() => eliminarTarea(t.id)}
                            >
                              🗑️
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>

        {/* ——— DERECHA: Perfil + accesos directos (70vh total) ——— */}
        <div className="w-full px-2 col-span-full lg:col-span-1 flex flex-col space-y-4">
          {/* PERFIL (30%) */}
          <Card className=" w-full  bg-white/80 backdrop-blur-sm flex-none overflow-hidden">
            <CardContent className="flex flex-col lg:flex-row h-full items-center justify-center p-4 space-y-4 lg:space-y-0 lg:space-x-4 text-center ">
              {/* Texto (izquierda en desktop) */}
              <div className="w-full lg:w-1/2 flex flex-col justify-center items-center lg:items-end text-center lg:text-right space-y-1">
                <p className="text-2xl lg:text-4xl font-bold text-gray-800">
                  {usuario.nombre}
                </p>
                <p className="text-lg lg:text-xl text-gray-500 capitalize">
                  {usuario.rol}
                </p>
                {usuario.rol === 'entrenador' && (
                  <p className="text-lg lg:text-xl text-gray-500">
                    Equipo: <span className="uppercase">{usuario.equipo}</span>
                  </p>
                )}
              </div>
              {/* Avatar (derecha en desktop) */}
              <div className="w-full lg:w-1/2 flex justify-center">
                <img
                  src={fotoSrc}
                  alt={`Foto de ${usuario.nombre}`}
                  className="h-28 w-28 lg:h-40 lg:w-40 rounded-full object-cover border-4 border-white shadow-md"
                  onError={(e) =>
                    (e.currentTarget.src = `${import.meta.env.BASE_URL}fotos/avatar-blank.png`)
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* ACCESOS DIRECTOS (cada uno 20%) */}
          {usuario.rol === 'entrenador' ? (
            <>
              {/* PLANTILLA */}
              <Card
                as="button"
                onClick={() =>
                  navigate('/plantilla', { state: { usuario } })
                }
                className="w-full h-40 sm:h-48 lg:h-[20%] relative flex-none cursor-pointer overflow-hidden rounded-lg shadow-lg transition hover:shadow-2xl"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${import.meta.env.BASE_URL}equipos/${usuario.equipo.toLowerCase()}/${usuario.equipo.toLowerCase()}.png)`,
                  }}
                />
                <div className="absolute inset-0 bg-black/40" />
                <CardContent className="relative flex items-center justify-center h-full p-4">
                  <h3 className="text-3xl font-bold text-white">PLANTILLA</h3>
                </CardContent>
              </Card>

              {/* REPOSITORIO */}
              <Card
                as="button"
                onClick={() =>
                  navigate('/repositorio', { state: { usuario } })
                }
                className="w-full bg-white/80 backdrop-blur-sm flex-none h-40 sm:h-48 lg:h-[20%] cursor-pointer rounded-lg shadow-lg transition hover:shadow-2xl"
              >
                <CardContent className="flex flex-col sm:flex-row items-center justify-center h-full p-4 space-y-2 sm:space-y-0 sm:space-x-4">
                  <img
                    src={`${import.meta.env.BASE_URL}repositorio.png`}
                    alt="Repositorio"
                    className="h-16 w-16 rounded flex-shrink-0"
                  />
                  <div className="text-center sm:text-left">
                    <h3 className="text-2xl font-bold text-gray-800">
                      REPOSITORIO
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Sube tus entrenamientos y convocatorias semanalmente.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* SCOUTING */}
              <Card
                as="button"
                onClick={() =>
                  navigate('/scout', { state: { usuario } })
                }
                className="w-full bg-white/80 backdrop-blur-sm flex-none h-40 sm:h-48 lg:h-[20%] cursor-pointer rounded-lg shadow-lg transition hover:shadow-2xl"
              >
                <CardContent className="flex flex-col sm:flex-row items-center justify-center h-full p-4 space-y-2 sm:space-y-0 sm:space-x-4">
                  <img
                    src={`${import.meta.env.BASE_URL}planificacion.png`}
                    alt="Scout"
                    className="h-16 w-16 rounded flex-shrink-0"
                  />
                  <div className="text-center sm:text-left">
                    <h3 className="text-2xl font-bold text-gray-800">
                      SCOUTING
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Consulta la base de datos y añade o descarga informes de jugadores en seguimiento.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* PLANTILLAS */}
              <Card
                as="button"
                onClick={() =>
                  navigate('/plantillas', { state: { usuario } })
                }
                className="w-full relative flex-none h-40 sm:h-48 lg:h-[20%] cursor-pointer overflow-hidden rounded-lg shadow-lg transition hover:shadow-2xl"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center"
                  style={{
                    backgroundImage: `url(${import.meta.env.BASE_URL}plantillas.png)`,
                  }}
                />
                <div className="absolute inset-0 bg-black/40" />
                <CardContent className="relative flex items-center justify-center h-full p-4">
                  <h3 className="text-4xl font-bold text-white">PLANTILLAS</h3>
                </CardContent>
              </Card>

              {/* CUENTAS */}
              <Card
                as="button"
                onClick={() =>
                  navigate('/cuentas', { state: { usuario } })
                }
                className="w-full bg-white/80 backdrop-blur-sm flex-none h-40 sm:h-48 lg:h-[20%] cursor-pointer rounded-lg shadow-lg transition hover:shadow-2xl"
              >
                <CardContent className="flex flex-col sm:flex-row items-center justify-center h-full p-4 space-y-2 sm:space-y-0 sm:space-x-4">
                  <img
                    src={`${import.meta.env.BASE_URL}cuentas.png`}
                    alt="Cuentas"
                    className="h-16 w-16 rounded flex-shrink-0"
                  />
                  <div className="text-center sm:text-left">
                    <h3 className="text-2xl font-bold text-gray-800">
                      CUENTAS
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Control de pagos de ropa y de cuotas anuales por jugador.
                    </p>
                  </div>
                </CardContent>
              </Card>

              {/* SCOUTING */}
              <Card
                as="button"
                onClick={() =>
                  navigate('/scout', { state: { usuario } })
                }
                className="w-full bg-white/80 backdrop-blur-sm flex-none h-40 sm:h-48 lg:h-[20%] cursor-pointer rounded-lg shadow-lg transition hover:shadow-2xl"
              >
                <CardContent className="flex flex-col sm:flex-row items-center justify-center h-full p-4 space-y-2 sm:space-y-0 sm:space-x-4">
                  <img
                    src={`${import.meta.env.BASE_URL}planificacion.png`}
                    alt="Scout"
                    className="h-16 w-16 rounded flex-shrink-0"
                  />
                  <div className="text-center sm:text-left">
                    <h3 className="text-2xl font-bold text-gray-800">
                      SCOUTING
                    </h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Consulta la base de datos y añade o descarga informes de jugadores en seguimiento.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
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
  className={`text-center px-2 ${
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