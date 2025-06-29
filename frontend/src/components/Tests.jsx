// Tests.jsx
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
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  Line,
  ComposedChart,
  LabelList,
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

export default function Tests() {
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

const [mostrarFormulario, setMostrarFormulario] = useState(false);
const toggleFormulario = () => setMostrarFormulario((prev) => !prev);

const [tests, setTests] = useState([]);
const [testsSeleccionados, setTestsSeleccionados] = useState([]);
const [modoEdicion, setModoEdicion] = useState(null); // ID del test que se está editando
const [edicionDatos, setEdicionDatos] = useState({});
const [mostrarGrafica, setMostrarGrafica] = useState(false);
const [datosComparacion, setDatosComparacion] = useState([]);
const [testIndividual, setTestIndividual] = useState(null);
const [mostrarGraficaIndividual, setMostrarGraficaIndividual] = useState(false);

function slugifyTitulo(titulo) {
  return titulo
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // elimina acentos
    .replace(/\s+/g, "_")            // espacios por guiones bajos
    .replace(/[^\w\-]/g, "");        // elimina caracteres especiales
}



// Para crear test
const [nuevoTest, setNuevoTest] = useState({
  titulo: '',
  descripcion: '',
  tipo: '',
  fecha: '',
});
const [valores, setValores] = useState({});

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
  if (!selectedTeam) return;
  fetch(`${import.meta.env.VITE_API_URL}/tests/${selectedTeam}`)
    .then(r => r.json())
    .then(data => {
      if (data.success) {
        setTests(data.tests);
      }
    })
    .catch(console.error);
}, [selectedTeam]);

//Crear test
const guardarTest = async () => {
  if (!nuevoTest.titulo || !nuevoTest.fecha) {
    alert("Debes completar el título y la fecha del test.");
    return;
  }

  // Validar que todos los jugadores tengan valor
  const idsJugadores = jugadores.map(j => j.id);
  const faltanValores = idsJugadores.some(id => !(id in valores));
  if (faltanValores) {
    alert("Debes asignar un valor a todos los jugadores. Si es 0, escribe 0.");
    return;
  }

  const payload = {
    ...nuevoTest,
    equipo: selectedTeam,
    creado_por: usuario.id,
    resultados: idsJugadores.map((id) => ({
      id_jugador: Number(id),
      valor: parseFloat(valores[id]),
    })),
  };

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/tests`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      alert("Test guardado correctamente.");

      // Reiniciar campos
      setNuevoTest({ titulo: '', descripcion: '', tipo: '', fecha: '' });
      setValores({});
      setMostrarFormulario(false); // ⬅️ Cierra el formulario

      // Recargar tests
      const ref = await fetch(`${import.meta.env.VITE_API_URL}/tests/${selectedTeam}`);
      const json = await ref.json();
      if (json.success) setTests(json.tests);
    } else {
      alert("Error al guardar el test.");
    }
  } catch (err) {
    console.error(err);
    alert("Error al conectar con el servidor.");
  }
};

//Eliminar test
const eliminarTest = async (id) => {
  if (!confirm('¿Seguro que quieres eliminar este test?')) return;

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/tests/${id}`, {
      method: 'DELETE',
    });
    const data = await res.json();
    if (data.success) {
      setTests((prev) => prev.filter((t) => t.id !== id));
      setTestsSeleccionados((prev) => prev.filter((tId) => tId !== id));
    } else {
      alert('Error al eliminar test.');
    }
  } catch (err) {
    console.error('Error al eliminar:', err);
    alert('Error al conectar con el servidor.');
  }
};

//Editar tests
const actualizarTest = async (id) => {
  const testOriginal = tests.find(t => t.id === id);

  const payload = {
    titulo: edicionDatos.titulo ?? testOriginal.titulo,
    tipo: edicionDatos.tipo ?? testOriginal.tipo,
    fecha: edicionDatos.fecha ?? testOriginal.fecha?.slice(0, 10),
    descripcion: edicionDatos.descripcion ?? testOriginal.descripcion,
    equipo: selectedTeam,
    resultados: testOriginal.resultados.map((r) => ({
  id_jugador: r.id_jugador,
  valor: parseFloat(edicionDatos[`res_${r.id_jugador}`] ?? r.valor)
}))
  };

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/tests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (data.success) {
      alert("Test actualizado.");
      setModoEdicion(null);
      setEdicionDatos({});
      const ref = await fetch(`${import.meta.env.VITE_API_URL}/tests/${selectedTeam}`);
      const json = await ref.json();
      if (json.success) setTests(json.tests);
    } else {
      alert("Error al actualizar.");
    }
  } catch (err) {
    console.error(err);
    alert("Error de servidor.");
  }
};

//Transformar datos para la grafica

function transformarDatosParaGrafico(tests) {
  const jugadoresMap = {};

  for (const test of tests) {
    const slug = slugifyTitulo(test.titulo);
    for (const res of test.resultados) {
      const key = res.id_jugador;
      if (!jugadoresMap[key]) {
        jugadoresMap[key] = { jugador: res.apodo };
      }
      jugadoresMap[key][slug] = res.valor;
    }
  }

  // Calcular la media correctamente
for (const jugador of Object.values(jugadoresMap)) {
  const entries = Object.entries(jugador);
  

  const valores = Object.entries(jugador)
  .filter(([key, value]) => key !== "jugador" && !isNaN(parseFloat(value)))
  .map(([_, value]) => parseFloat(value));

  

  jugador.media = valores.length
    ? parseFloat((valores.reduce((a, b) => a + b, 0) / valores.length).toFixed(2))
    : null;
}

  
  return Object.values(jugadoresMap);
}

//Transformar para grafica de un solo test.
function transformarTestIndividualParaGrafico(test) {
  const slug = slugifyTitulo(test.titulo);

  const datos = test.resultados.map(r => {
    const valor = typeof r.valor === 'number' ? r.valor : parseFloat(r.valor);
    return {
      jugador: r.apodo,
      [slug]: valor,
      punto: valor, // usamos "punto" para trazar la línea
    };
  });

  console.log("✅ Datos individuales transformados:", datos);
  return datos;
}

///////////////////////
  return (
    <div
    className="relative flex flex-col min-h-screen bg-cover bg-center"
    style={{
      backgroundImage: `url(${import.meta.env.BASE_URL}central.png)`,
      backgroundColor: 'rgba(255, 255, 255, 0.1)', // suaviza el fondo como en Plantilla
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







<main className="flex-grow p-6 bg-gradient-to-b from-red-50 to-white/90">
  {/* BOTÓN MOSTRAR FORMULARIO */}
  <div className="max-w-4xl mx-auto mb-6">
    <Button
      className="bg-red-600 hover:bg-red-700 text-white"
      onClick={toggleFormulario}
    >
      {mostrarFormulario ? "🔽 Ocultar formulario" : "➕ Crear nuevo test físico"}
    </Button>
  </div>
  {testsSeleccionados.length >= 2 && (
  <div className="text-center my-4">
    <Button
      className="bg-blue-600 text-white hover:bg-blue-700"
      onClick={async () => {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/comparartests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: testsSeleccionados }),
          });
          const data = await res.json();
          if (data.success) {
            setDatosComparacion(data.tests);
            setMostrarGrafica(true);
          } else {
            alert("No se pudo cargar la comparación.");
          }
        } catch (err) {
          console.error(err);
          alert("Error al conectar con el servidor.");
        }
      }}
    >
      📊 Comparar {testsSeleccionados.length} tests
    </Button>
  </div>

)}
  {/* FORMULARIO */}
  {mostrarFormulario && (
    <div className="max-w-6xl mx-auto bg-white shadow rounded-xl p-6">
      <h2 className="text-xl font-bold text-red-700">➕ Crear nuevo test físico</h2>

      <div className="flex flex-col">
  <label className="text-sm font-semibold text-gray-700 mb-1">
          Título *</label>
          <input
            type="text"
            value={nuevoTest.titulo}
            onChange={(e) => setNuevoTest((prev) => ({ ...prev, titulo: e.target.value }))}
            className="mt-1 w-full border rounded px-3 py-1"
            required
          />
        

        <label className="block">
          Tipo de test (opcional)
          <input
            type="text"
            value={nuevoTest.tipo}
            onChange={(e) => setNuevoTest((prev) => ({ ...prev, tipo: e.target.value }))}
            className="mt-1 w-full border rounded px-3 py-1"
          />
        </label>

        <label className="block col-span-2">
          Descripción (opcional)
          <textarea
            value={nuevoTest.descripcion}
            onChange={(e) => setNuevoTest((prev) => ({ ...prev, descripcion: e.target.value }))}
            className="mt-1 w-full border rounded px-3 py-2"
            rows={3}
          />
        </label>

        <label className="block">
          Fecha de realización *
          <input
            type="date"
            value={nuevoTest.fecha}
            onChange={(e) => setNuevoTest((prev) => ({ ...prev, fecha: e.target.value }))}
            className="mt-1 w-full border rounded px-3 py-1"
            required
          />
        </label>
      </div>

      <div className="mt-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-2">Valores por jugador</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 gap-y-6 py-2">
          {jugadores.map((j) => (
            <label key={j.id} className="block">
              {j.apodo?.toUpperCase()} ({j.nombre_completo})
              <input
                type="number"
                step="0.01"
                placeholder="Ej: 6.42"
                value={valores[j.id] || ''}
                onChange={(e) =>
                  setValores((prev) => ({ ...prev, [j.id]: e.target.value }))
                }
                className="mt-1 w-full border rounded px-3 py-1"
              />
            </label>
          ))}
        </div>
      </div>

      <div className="flex justify-end mt-4">
        <Button
          className="bg-red-600 hover:bg-red-700 text-white"
          onClick={guardarTest}
        >
          💾 Guardar test
        </Button>
      </div>
    </div>
  )}

  {/* LISTADO DE TESTS */}
  <div className="max-w-4xl mx-auto bg-white shadow rounded-xl p-6">
    <h2 className="text-xl font-bold text-gray-800 mb-4">📋 Tests</h2>
    {/* Aquí irán los tests cuando los carguemos */}
    {tests.length === 0 ? (
  <p className="text-gray-500 italic">Aún no hay tests creados.</p>
) : (
  <div className="space-y-4">
    {tests.map((test) => (
      <Card key={test.id}>
        <CardHeader className="flex justify-between items-center">
  <div className="flex items-center gap-4">
    <input
      type="checkbox"
      className="w-6 h-6 accent-red-600"
      checked={testsSeleccionados.includes(test.id)}
      onChange={(e) =>
        setTestsSeleccionados((prev) =>
          e.target.checked
            ? [...prev, test.id]
            : prev.filter((id) => id !== test.id)
        )
      }
    />
    <CardTitle className="text-red-800 text-lg font-semibold">
      {test.titulo}
    </CardTitle>
  </div>
  <div className="flex space-x-2">
    <Button size="sm" onClick={() => setModoEdicion(test.id)}>✏️</Button>
<Button size="sm" variant="destructive" onClick={() => eliminarTest(test.id)}>🗑️</Button>
<Button size="sm" variant="outline" onClick={() => {
  setTestIndividual(test);
  setMostrarGraficaIndividual(true);
}}>📊</Button>
  </div>
</CardHeader>
        <CardContent>
          <p><strong>Tipo:</strong> {test.tipo || '—'}</p>
          <p><strong>Fecha:</strong> {new Date(test.fecha).toLocaleDateString()}</p>
          <p><strong>Descripción:</strong> {test.descripcion || '—'}</p>
        </CardContent>
        {modoEdicion === test.id && (
  <div className="p-4 border-t mt-2 space-y-2 bg-red-50 rounded">
    <label className="block">
      Título:
      <input
        className="w-full border px-2 py-1 rounded"
        value={edicionDatos.titulo || test.titulo}
        onChange={(e) =>
          setEdicionDatos((prev) => ({ ...prev, titulo: e.target.value }))
        }
      />
    </label>

    <label className="block">
      Tipo:
      <input
        className="w-full border px-2 py-1 rounded"
        value={edicionDatos.tipo || test.tipo || ''}
        onChange={(e) =>
          setEdicionDatos((prev) => ({ ...prev, tipo: e.target.value }))
        }
      />
    </label>

    <label className="block">
      Fecha:
      <input
        type="date"
        className="w-full border px-2 py-1 rounded"
        value={edicionDatos.fecha || test.fecha?.slice(0, 10)}
        onChange={(e) =>
          setEdicionDatos((prev) => ({ ...prev, fecha: e.target.value }))
        }
      />
    </label>

    <label className="block">
      Descripción:
      <textarea
        className="w-full border px-2 py-1 rounded"
        value={edicionDatos.descripcion || test.descripcion || ''}
        onChange={(e) =>
          setEdicionDatos((prev) => ({ ...prev, descripcion: e.target.value }))
        }
      />
    </label>
<h4 className="text-lg font-semibold mt-4">✍️ Marcas por jugador</h4>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 gap-y-6 mt-2">
      {test.resultados?.map((r) => (
        <label key={r.id_jugador} className="block">
          {r.apodo?.toUpperCase() || 'SIN NOMBRE'}
          <input
            type="number"
            step="0.01"
            value={edicionDatos[`res_${r.id_jugador}`] ?? r.valor}
            onChange={(e) =>
              setEdicionDatos((prev) => ({
                ...prev,
                [`res_${r.id_jugador}`]: e.target.value
              }))
            }
            className="mt-1 w-full border rounded px-3 py-1"
          />
        </label>
      ))}
    </div>
    <div className="flex justify-end gap-2">
      <Button onClick={() => actualizarTest(test.id)} className="bg-gray-700 text-white">
        Guardar
      </Button>
      <Button onClick={() => setModoEdicion(null)} className="bg-gray-700 text-white" >
        Cancelar
      </Button>
    </div>
  </div>
)}
      </Card>
    ))}
  </div>
)}
  </div>
  {testsSeleccionados.length >= 2 && (
  <div className="text-center my-4">
    <Button
      className="bg-blue-600 text-white hover:bg-blue-700"
      onClick={async () => {
        try {
          const res = await fetch(`${import.meta.env.VITE_API_URL}/comparartests`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ids: testsSeleccionados }),
          });
          const data = await res.json();
          if (data.success) {
            setDatosComparacion(data.tests);
            setMostrarGrafica(true);
          } else {
            alert("No se pudo cargar la comparación.");
          }
        } catch (err) {
          console.error(err);
          alert("Error al conectar con el servidor.");
        }
      }}
    >
      📊 Comparar {testsSeleccionados.length} tests
    </Button>
  </div>
)}

{mostrarGrafica && (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
    <div className="bg-white w-full max-w-6xl rounded-xl shadow-xl p-6 relative">
      {/* Botón cerrar */}
      <button
        onClick={() => setMostrarGrafica(false)}
        className="absolute top-4 right-4 text-xl text-gray-700 hover:text-black"
      >
        ✖
      </button>

      <h3 className="text-xl font-bold text-red-700 mb-4">📈 Resultados comparativos </h3>

      <div className="w-full h-[500px]">
<ResponsiveContainer width="100%" height="100%">
  <ComposedChart data={transformarDatosParaGrafico(datosComparacion)}>
    <XAxis dataKey="jugador" />
    <YAxis />
    <Tooltip />
    <Legend />

    {datosComparacion.map((t, idx) => (
      <Bar
  key={t.id}
  dataKey={slugifyTitulo(t.titulo)}
  name={t.titulo} // así aparece bonito en la leyenda
  fill={`hsl(${idx * 90}, 70%, 50%)`}
/>
    ))}

    <Line
      type="monotone"
      dataKey="media"
      stroke="#000"
      strokeWidth={3}
      dot={{ r: 4 }}
      activeDot={{ r: 6 }}
      name="Evolución media"
    />
  </ComposedChart>
</ResponsiveContainer>
</div>
    </div>
  </div>
)}

{mostrarGraficaIndividual && testIndividual && (
  <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-6">
    <div className="bg-white w-full max-w-4xl rounded-xl shadow-xl p-6 relative">
      <button
        onClick={() => setMostrarGraficaIndividual(false)}
        className="absolute top-4 right-4 text-xl text-gray-700 hover:text-black"
      >
        ✖
      </button>

      <h3 className="text-xl font-bold text-red-700 mb-4">📈 {testIndividual.titulo}</h3>

      <div className="w-full h-[500px]">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={transformarTestIndividualParaGrafico(testIndividual)}>
            <XAxis dataKey="jugador" />
            <YAxis />
            <Tooltip />
            <Legend />

            {/* Columna rojo claro */}
            <Bar
              dataKey={slugifyTitulo(testIndividual.titulo)}
              fill="#ff7f7f"
              name={testIndividual.titulo}
            />

            {/* Línea roja con puntos y etiqueta */}
            <Line
              type="monotone"
              dataKey="punto"
              stroke="#d00000"
              strokeWidth={2}
              dot={{ r: 4, fill: '#d00000' }}
              activeDot={{ r: 6 }}
              name="Valor"
              legendType="line"
            >
              <LabelList
                dataKey="punto"
                position="top"
                style={{ fill: 'black', fontWeight: 'bold', textShadow: '1px 1px 1px white' }}
                formatter={(v) => v?.toFixed?.(2)}
              />
            </Line>
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  </div>
)}

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