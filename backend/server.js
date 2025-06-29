const fs      = require('fs');
const express = require("express");
const cors    = require('cors');
//const bodyParser = require('body-parser');
const path    = require('path');
const multer  = require('multer');
const pool    = require('./db');
const app = express();
const PORT = 3000;
const rateLimit = require('express-rate-limit');
const PDFDocument = require('pdfkit');
const bcrypt = require('bcrypt');





app.use(cors());
app.use(express.static("public"));
//app.use(bodyParser.json());
app.use(express.json());

// Limitar intentos de login: máx 5 cada 5 minutos por IP
const loginLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutos
  max: 5, // máximo 5 intentos por IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: '⛔ Demasiados intentos de inicio de sesión. Inténtalo 5 minutos más tarde.',
  },
});

// 1) Directorio principal de uploads
const uploadDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// 2) Creamos un subdirectorio específico para las fotos de jugadores
const jugadorDir = path.join(uploadDir, 'jugadores');
if (!fs.existsSync(jugadorDir)) {
  fs.mkdirSync(jugadorDir, { recursive: true });
}

// 3) Servimos todo /uploads/* como estáticos (incluido /uploads/jugadores/*)
app.use('/uploads', express.static(uploadDir));

//4 Ruta para tener todo organizado
// Subcarpeta específica para Repositorio Semanal
const repoSemanalDir = path.join(uploadDir, 'repositorio-semanal');
if (!fs.existsSync(repoSemanalDir)) {
  fs.mkdirSync(repoSemanalDir, { recursive: true });
}

// Creamos un storage específico para fotos de jugador
const storageJug = multer.diskStorage({
  destination: (req, file, cb) => cb(null, jugadorDir),
  filename:    (req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  }
});
const uploadJug = multer({ storage: storageJug });

//  `upload` genérico para otros usos,  apuntando a uploadDir.
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  }
});
const upload = multer({ storage });

//PrepFisica) Subcarpeta específica para Repositorio Físico
const repoFisicoDir = path.join(uploadDir, 'repositorio-fisico');
if (!fs.existsSync(repoFisicoDir)) {
  fs.mkdirSync(repoFisicoDir, { recursive: true });
}

//METODOLOGÍA) 
const metodologiaDir = path.join(uploadDir, 'metodologia');
if (!fs.existsSync(metodologiaDir)) {
  fs.mkdirSync(metodologiaDir, { recursive: true });
}

const storageRepoFisico = multer.diskStorage({
  destination: (req, file, cb) => {
  try {
    const equipo = req.query.equipo;
    const bloque = req.query.bloque;
    const semana = req.query.semana;
    const dia = req.query.dia;

    if (!equipo) throw new Error("❌ No se proporcionó 'equipo'");

    let dir;
    if (bloque) {
      dir = path.join(repoFisicoDir, equipo, `bloque_${bloque}_guia`);
    } else {
      if (!semana || !dia) throw new Error("❌ Faltan 'semana' o 'dia'");
      dir = path.join(repoFisicoDir, equipo, `semana_${semana}`, dia);
    }

    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  } catch (err) {
    console.error("❌ Error creando carpeta:", err.message);
    cb(err);
  }
},
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  }
});

const uploadRepoFisico = multer({ storage: storageRepoFisico });

const storageRepoSemanal = multer.diskStorage({
  destination: (req, file, cb) => {
  try {
    const equipo = req.query.equipo || req.body.equipo;
    const semana = req.query.semana || req.body.semana;
    const dia    = req.query.dia || req.body.dia;

    if (!equipo || !semana || !dia) throw new Error("❌ Falta equipo, semana o día");

    const dir = path.join(repoSemanalDir, equipo, `semana_${semana}`, dia);
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  } catch (err) {
    console.error("❌ Error creando carpeta destino repositorio semanal:", err.message);
    cb(err);
  }
},
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  }
});

const uploadRepoSemanal = multer({ storage: storageRepoSemanal });

const storageMetodologia = multer.diskStorage({
  destination: (req, file, cb) => {
    const subdir = metodologiaDir;
    if (!subdir) {
      console.error("❌ Error: carpeta de metodología no válida");
      return cb(new Error("Destino no válido"));
    }
    cb(null, subdir);
  },
  filename: (req, file, cb) => {
    const safe = file.originalname.replace(/\s+/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  }
});
const uploadMetodologia = multer({ storage: storageMetodologia });


// LOGIN con bcrypt.
app.post('/login', loginLimiter, async (req, res) => {
  const { email, clave } = req.body;

  try {
    const query = 'SELECT * FROM usuarios WHERE email = $1';
    const result = await pool.query(query, [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    const usuario = result.rows[0];
    const coincide = await bcrypt.compare(clave, usuario.clave);

    if (!coincide) {
      return res.status(401).json({ success: false, message: 'Credenciales inválidas' });
    }

    delete usuario.clave;
    res.status(200).json({ success: true, usuario });
  } catch (err) {
    console.error('Error al validar credenciales:', err);
    res.status(500).json({ success: false, message: 'Error del servidor' });
  }
});

// Obtener usuarios por rol: /usuarios?rol=entrenador
app.get('/usuarios', async (req, res) => {
  const rol = req.query.rol;
  try {
    const resultado = await pool.query(
      'SELECT id, nombre FROM usuarios WHERE rol = $1',
      [rol]
    );
    res.json({ success: true, usuarios: resultado.rows });
  } catch (err) {
    console.error('Error al listar usuarios:', err);
    res.status(500).json({ success: false, error: 'Error al listar usuarios' });
  }
});
// Obtener todos los equipos desde el enum equipo_type
app.get('/equipos', async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT unnest(enum_range(NULL::equipo_tipo)) AS equipo`
    );
    const equipos = resultado.rows.map(r => r.equipo);
    res.json({ success: true, equipos });
  } catch (err) {
    console.error('Error al listar equipos:', err);
    res.status(500).json({ success: false, error: 'Error al listar equipos' });
  }
});
// =======================
//  RUTAS DE TAREAS
// =======================

// 1) Listar tareas de un usuario (GET /tareas/:asignado_para)
app.get('/tareas/:asignado_para', async (req, res) => {
  const asignadoPara = parseInt(req.params.asignado_para, 10);

  try {
    const resultado = await pool.query(
      `SELECT
        t.id,
        t.descripcion,
        t.completado,
        t.limite,
        uc.nombre    AS creado_por_nombre,
        ua.nombre    AS asignado_a_nombre
      FROM tareas t
      LEFT JOIN usuarios uc ON t.creado_por    = uc.id
      LEFT JOIN usuarios ua ON t.asignado_para = ua.id
      WHERE t.asignado_para = $1
      ORDER BY t.creado_fecha DESC
      `,
      [asignadoPara]
    );
    res.status(200).json({ success: true, tareas: resultado.rows });
  } catch (err) {
    console.error('Error al obtener tareas:', err);
    res.status(500).json({ success: false, error: 'Error al obtener tareas' });
  }
});

// 1.2) Listar tareas que yo creé (asignadas a otros)
app.get('/tareas/creadas/:creador', async (req, res) => {
  const creador = parseInt(req.params.creador, 10);
  try {
    const resultado = await pool.query(
      `
      SELECT
        t.id,
        t.descripcion,
        t.completado,
        t.limite,
        uc.nombre AS creado_por_nombre,
        ua.nombre AS asignado_a_nombre
      FROM tareas t
      LEFT JOIN usuarios uc ON t.creado_por    = uc.id
      LEFT JOIN usuarios ua ON t.asignado_para = ua.id
      WHERE t.creado_por = $1
      ORDER BY t.creado_fecha DESC
      `,
      [creador]
    );
    
    res.status(200).json({ success: true, tareas: resultado.rows });
  } catch (err) {
    console.error('Error al obtener tareas creadas:', err);
    res.status(500).json({ success: false, error: 'Error al obtener tareas creadas' });
  }
});

// 2) Crear nueva tarea (POST /tareas)
//    Body esperado:
//    {
//      descripcion: "Texto",
//      asignado_para: 3,        // opcional: si no se envía, lo asignamos al mismo creador
//      creado_por: 5,           // id del usuario que crea
//      limite: "2025-06-01"     // opcional, string en formato YYYY-MM-DD
//    }
app.post('/tareas', async (req, res) => {
  const { descripcion, asignado_para, creado_por, limite } = req.body;
  const asignadoPara = asignado_para || creado_por;
  try {
    const resultado = await pool.query(
      `INSERT INTO tareas
         (descripcion, asignado_para, creado_por, limite)
       VALUES ($1, $2, $3, $4)
       RETURNING id, descripcion, completado, limite`,
      [descripcion, asignadoPara, creado_por, limite || null]
    );
    res.status(201).json({ success: true, tarea: resultado.rows[0] });
  } catch (err) {
    console.error('Error al crear tarea:', err);
    res.status(500).json({ success: false, error: 'Error al crear tarea' });
  }
});

// 3) Marcar o desmarcar tarea (PATCH /tareas/:id)
//    Body esperado: { completado: true|false }
app.patch('/tareas/:id', async (req, res) => {
  const tareaId = parseInt(req.params.id, 10);
  const { completado } = req.body;
  try {
    const resultado = await pool.query(
      `UPDATE tareas
         SET completado = $1,
             completado_fecha = CASE WHEN $1 THEN NOW() ELSE NULL END
       WHERE id = $2
       RETURNING id, descripcion, completado, limite`,
      [completado, tareaId]
    );
    if (resultado.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Tarea no encontrada' });
    }
    res.json({ success: true, tarea: resultado.rows[0] });
  } catch (err) {
    console.error('Error al actualizar tarea:', err);
    res.status(500).json({ success: false, error: 'Error al actualizar tarea' });
  }
});

// 4) Eliminar una tarea completada (DELETE /tareas/:id)
app.delete('/tareas/:id', async (req, res) => {
  const tareaId = parseInt(req.params.id, 10);
  try {
    const resultado = await pool.query(
      `DELETE FROM tareas
       WHERE id = $1`,
      [tareaId]
    );
    if (resultado.rowCount === 0) {
      return res.status(404).json({ success: false, error: 'Tarea no encontrada' });
    }
    res.json({ success: true });
  } catch (err) {
    console.error('Error al eliminar tarea:', err);
    res.status(500).json({ success: false, error: 'Error al eliminar tarea' });
  }
});


// =======================
//  FIN RUTAS DE TAREAS
// =======================



// --- RUTA GET para listar archivos por equipo o TODOS ---
app.get('/repositorio/:equipo', async (req, res) => {
  let { equipo } = req.params;
  try {
    let resultado;
    if (equipo === 'todo') {
      resultado = await pool.query(
        `SELECT semana, dia, nombre, ruta, equipo
           FROM repositorio
          ORDER BY semana,
            CASE dia
              WHEN 'Lunes' THEN 1 WHEN 'Martes' THEN 2 WHEN 'Miércoles' THEN 3
              WHEN 'Jueves' THEN 4 WHEN 'Viernes' THEN 5 ELSE 6
            END`
      );
    } else {
      resultado = await pool.query(
        `SELECT semana, dia, nombre, ruta, equipo
           FROM repositorio
          WHERE equipo = $1
          ORDER BY semana,
            CASE dia
              WHEN 'Lunes' THEN 1 WHEN 'Martes' THEN 2 WHEN 'Miércoles' THEN 3
              WHEN 'Jueves' THEN 4 WHEN 'Viernes' THEN 5 ELSE 6
            END`,
        [equipo]
      );
    }
    res.json({ success: true, archivos: resultado.rows });
  } catch (err) {
    console.error('Error al listar repositorio:', err);
    res.status(500).json({ success: false, error: 'Error de servidor' });
  }
});

// --- RUTA POST para subir PDF al repositorio ---
app.post('/repositorio', uploadRepoSemanal.single('pdf'), async (req, res) => {
  let { equipo, semana, dia, creado_por } = req.body;

  creado_por = parseInt(creado_por, 10);

  // 1) Si no recibimos equipo, lo buscamos en la tabla usuarios
  if (!equipo) {
    try {
      const userRes = await pool.query(
        'SELECT equipo FROM usuarios WHERE id = $1',
        [creado_por]
      );
      if (userRes.rowCount === 0) {
        return res
          .status(400)
          .json({ success: false, error: 'Usuario no encontrado' });
      }
      equipo = userRes.rows[0].equipo; 
    } catch (err) {
      console.error('Error al consultar equipo del usuario:', err);
      return res
        .status(500)
        .json({ success: false, error: 'Error de servidor' });
    }
  }

  if (!req.file) {
    return res.status(400).json({ success: false, error: 'Falta fichero' });
  }

  const nombre = req.file.originalname;
  const ruta = path.relative(__dirname, req.file.path);
  semana = parseInt(semana, 10);

  try {
    const { rows } = await pool.query(
      `INSERT INTO repositorio
         (equipo, semana, dia, nombre, ruta, creado_por)
       VALUES ($1,$2,$3,$4,$5,$6)
       RETURNING semana, dia, nombre, ruta`,
      [equipo, semana, dia, nombre, ruta, creado_por]
    );
    res.status(201).json({ success: true, archivo: rows[0], url: ruta });
  } catch (err) {
    console.error('Error al guardar repositorio:', err);
    res.status(500).json({ success: false, error: 'Error de servidor' });
  }
});


// Eliminar un archivo del repositorio (DELETE /repositorio)
app.delete('/repositorio', async (req, res) => {
  const { equipo, semana, dia } = req.body;
  try {
    // 1. Recuperar la ruta del archivo
    const { rows } = await pool.query(
      `SELECT ruta FROM repositorio
         WHERE equipo = $1 AND semana = $2 AND dia = $3`,
      [equipo, parseInt(semana, 10), dia]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Archivo no encontrado' });
    }
    const ruta = rows[0].ruta; // ej. '/uploads/1654048343-file.pdf'
    const filePath = path.join(__dirname, ruta);

    // 2. Borrar fichero del disco
    fs.unlink(filePath, err => {
      if (err) console.error('Error borrando fichero:', err);
    });

    // 3. Eliminar registro en la BBDD
    await pool.query(
      `DELETE FROM repositorio
         WHERE equipo = $1 AND semana = $2 AND dia = $3`,
      [equipo, parseInt(semana, 10), dia]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error al eliminar archivo repositorio:', err);
    res.status(500).json({ success: false, error: 'Error de servidor' });
  }
});

// --- RUTAS DE JUGADORES ---

// 1) Listar jugadores de un equipo (GET /jugadores/:equipo)
app.get('/jugadores/:equipo', async (req, res) => {
  const equipo = req.params.equipo;
  try {
    let query, params;
    if (equipo === 'todo') {
      query = `SELECT * FROM jugadores ORDER BY nombre_completo`;
      params = [];
    } else {
      query = `SELECT * FROM jugadores WHERE equipo = $1 ORDER BY nombre_completo`;
      params = [equipo];
    }
    const { rows } = await pool.query(query, params);
    res.json({ success: true, jugadores: rows });
  } catch (err) {
    console.error('Error listado jugadores:', err);
    res.status(500).json({ success: false, error: 'Error servidor' });
  }
});

// 2) Crear jugador (POST /jugadores)
// RUTA POST para crear jugador (con imagen)
// --- DESPUÉS: así debe quedar ---
app.post('/jugadores', uploadJug.single('imagen'), async (req, res) => {
  // 1) Extraemos campos obligatorios del body
  const {
    nombre_completo,
    apodo,
    fecha_nacimiento,
    dni,
    seguridad_social,
    equipo,
    telefono,
    email,
    nacionalidad,
    ciudad,
    direccion_postal,
    codigo_postal,
    posicion_principal,
    lateralidad
  } = req.body;

  // 2) Parseamos posiciones_secundarias si viene como cadena JSON; si no, dejamos array vacío
  let posiciones_secundarias = [];
  if (req.body.posiciones_secundarias) {
    try {
      posiciones_secundarias = JSON.parse(req.body.posiciones_secundarias);
    } catch {
      posiciones_secundarias = [];
    }
  }

  // 3) Validación de campos obligatorios
  if (
    !nombre_completo ||
    !fecha_nacimiento ||
    !dni ||
    !seguridad_social ||
    !equipo ||
    !telefono ||
    !email ||
    !nacionalidad ||
    !ciudad ||
    !direccion_postal ||
    !codigo_postal ||
    !posicion_principal ||
    !lateralidad
  ) {
    return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' });
  }

  // 4) Procesamos la imagen si se subió (ahora opcional)
  let rutaImagen = null;
  if (req.file) {
    rutaImagen = `/uploads/jugadores/${req.file.filename}`;
  }

  try {
    // 5) Ejecutamos el INSERT, pasando `posiciones_secundarias` ya como array de JS
    const { rows } = await pool.query(
      `INSERT INTO jugadores
         (nombre_completo, apodo, fecha_nacimiento, dni, seguridad_social,
          equipo, telefono, email, nacionalidad, ciudad, direccion_postal,
          codigo_postal, posicion_principal, posiciones_secundarias, lateralidad,
          imagen, creado_fecha, actualizado_fecha)
       VALUES
         ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16, NOW(), NOW())
       RETURNING id`,
      [
        nombre_completo,
        apodo,
        fecha_nacimiento,
        dni,
        seguridad_social,
        equipo,
        telefono,
        email,
        nacionalidad,
        ciudad,
        direccion_postal,
        codigo_postal,
        posicion_principal,
        posiciones_secundarias,
        lateralidad,
        rutaImagen           // vale null si no se subió imagen
      ]
    );

    return res.status(201).json({ success: true, id: rows[0].id });
  } catch (err) {
    console.error('Error al guardar jugador:', err);
    return res.status(500).json({ success: false, error: 'Error de servidor' });
  }
});


// 3) RUTA PATCH para editar jugador (sin actualizar posiciones_secundarias)
app.patch('/jugadores/:id', uploadJug.single('imagen'), async (req, res) => {
  // 1) Extraemos campos obligatorios del body
  const {
    nombre_completo,
    apodo,
    fecha_nacimiento,
    dni,
    seguridad_social,
    equipo,
    telefono,
    email,
    nacionalidad,
    ciudad,
    direccion_postal,
    codigo_postal,
    posicion_principal,
    lateralidad
  } = req.body;

  // 2) Validación de campos obligatorios
  if (
    !nombre_completo ||
    !fecha_nacimiento ||
    !dni ||
    !seguridad_social ||
    !equipo ||
    !telefono ||
    !email ||
    !nacionalidad ||
    !ciudad ||
    !direccion_postal ||
    !codigo_postal ||
    !posicion_principal ||
    !lateralidad
  ) {
    return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' });
  }

  // 3) Preparamos la nueva ruta de la imagen (si se subió)
  let imagenPath = null;
  if (req.file) {
    imagenPath = `/uploads/jugadores/${req.file.filename}`;
  }

  try {
    // 4) Convertimos lateralidad a minúsculas para que coincida con el enum
    const lat = lateralidad.toLowerCase();

    if (imagenPath) {
      // a) Con imagen nueva
      await pool.query(
        `UPDATE jugadores SET
           nombre_completo      = $1,
           apodo                = $2,
           fecha_nacimiento     = $3,
           dni                  = $4,
           seguridad_social     = $5,
           equipo               = $6,
           telefono             = $7,
           email                = $8,
           nacionalidad         = $9,
           ciudad               = $10,
           direccion_postal     = $11,
           codigo_postal        = $12,
           posicion_principal   = $13::posicion,
           lateralidad          = $14::lateralidad_tipo,
           imagen               = $15,
           actualizado_fecha    = NOW()
         WHERE id = $16`,
        [
          nombre_completo,              // $1
          apodo,                        // $2
          fecha_nacimiento,             // $3
          dni,                          // $4
          seguridad_social,             // $5
          equipo,                       // $6
          telefono,                     // $7
          email,                        // $8
          nacionalidad,                 // $9
          ciudad,                       // $10
          direccion_postal,             // $11
          codigo_postal,                // $12
          posicion_principal,           // $13
          lat,                          // $14
          imagenPath,                   // $15
          parseInt(req.params.id, 10)   // $16
        ]
      );
    } else {
      // b) Sin cambiar imagen
      await pool.query(
        `UPDATE jugadores SET
           nombre_completo      = $1,
           apodo                = $2,
           fecha_nacimiento     = $3,
           dni                  = $4,
           seguridad_social     = $5,
           equipo               = $6,
           telefono             = $7,
           email                = $8,
           nacionalidad         = $9,
           ciudad               = $10,
           direccion_postal     = $11,
           codigo_postal        = $12,
           posicion_principal   = $13::posicion,
           lateralidad          = $14::lateralidad_tipo,
           actualizado_fecha    = NOW()
         WHERE id = $15`,
        [
          nombre_completo,              // $1
          apodo,                        // $2
          fecha_nacimiento,             // $3
          dni,                          // $4
          seguridad_social,             // $5
          equipo,                       // $6
          telefono,                     // $7
          email,                        // $8
          nacionalidad,                 // $9
          ciudad,                       // $10
          direccion_postal,             // $11
          codigo_postal,                // $12
          posicion_principal,           // $13
          lat,                          // $14
          parseInt(req.params.id, 10)   // $15
        ]
      );
    }

    return res.json({ success: true });
  } catch (err) {
    console.error('Error al editar jugador:', err);
    return res.status(500).json({ success: false, error: 'Error de servidor' });
  }
});


// 4) Eliminar jugador (DELETE /jugadores/:id)
app.delete('/jugadores/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  try {
    // 1. Eliminar resultados físicos
    await pool.query(`DELETE FROM resultados_tests WHERE id_jugador = $1`, [id]);

    // 2. Eliminar cuotas
    await pool.query(`DELETE FROM cuotas WHERE jugador_id = $1`, [id]);

    // 3. Eliminar RPE
    await pool.query(`DELETE FROM rpe WHERE jugador_id = $1`, [id]);

    // 4. Finalmente, borrar el jugador
    await pool.query(`DELETE FROM jugadores WHERE id = $1`, [id]);

    return res.json({ success: true });
  } catch (err) {
    console.error('Error borrando jugador con cascada:', err);
    return res.status(500).json({ success: false, error: 'Error servidor' });
  }
});

// 5) Mover varios jugadores (PATCH /jugadores/mover). AL mover hay que gestionar el movimiento tambien en cuotas, tests...
app.patch('/jugadores-mover-masivo', async (req, res) => {
  let { ids, nuevoEquipo } = req.body;

  if (typeof ids === "string") ids = [parseInt(ids)];
  if (Array.isArray(ids)) ids = ids.map((id) => parseInt(id)).filter((id) => !isNaN(id));

  if (
    !Array.isArray(ids) ||
    ids.length === 0 ||
    typeof nuevoEquipo !== "string" ||
    nuevoEquipo.trim() === ""
  ) {
    return res.status(400).json({ success: false, error: "Faltan campos obligatorios" });
  }

  try {
    const nuevo = nuevoEquipo.toLowerCase();

    // 1) Cambiar equipo en tabla jugadores
    await pool.query(
      `UPDATE jugadores SET equipo = $1 WHERE id = ANY($2::int[])`,
      [nuevo, ids]
    );

    // 2) Actualizar equipo en tabla cuotas
    await pool.query(
      `UPDATE cuotas SET equipo = $1 WHERE jugador_id = ANY($2::int[])`,
      [nuevo, ids]
    );

    // 3) Borrar resultados de test
    await pool.query(
      `DELETE FROM resultados_tests WHERE id_jugador = ANY($1::int[])`,
      [ids]
    );

    // 4) Borrar registros RPE del jugador
    await pool.query(
      `DELETE FROM rpe WHERE jugador_id = ANY($1::int[])`,
      [ids]
    );

    return res.json({ success: true });
  } catch (err) {
    console.error("❌ Error al mover jugadores:", err);
    return res.status(500).json({ success: false, error: "Error servidor" });
  }
});

//Cumpleaños en el pie de página

app.get('/cumples', async (req, res) => {
  try {
    const resultado = await pool.query(`
      SELECT id, apodo, fecha_nacimiento, equipo
      FROM jugadores
      WHERE fecha_nacimiento IS NOT NULL
    `);
    res.json({ success: true, jugadores: resultado.rows });
  } catch (err) {
    console.error('Error al obtener cumpleaños:', err);
    res.status(500).json({ success: false });
  }
});

//TESTS//
///////////////////////

// 1) CREAR TEST
app.post('/tests', async (req, res) => {
  const { titulo, descripcion, tipo, fecha, equipo, creado_por, resultados } = req.body;

  if (!titulo || !fecha || !equipo || !creado_por || !Array.isArray(resultados)) {
    return res.status(400).json({ success: false, error: 'Faltan datos obligatorios' });
  }

  try {
    const testRes = await pool.query(
      `INSERT INTO tests_fisicos (titulo, descripcion, tipo, fecha, equipo, creado_por)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [titulo, descripcion || null, tipo || null, fecha, equipo, creado_por]
    );

    const id_test = testRes.rows[0].id;

    const inserts = resultados.map(({ id_jugador, valor }) =>
      pool.query(
        `INSERT INTO resultados_tests (id_test, id_jugador, valor)
         VALUES ($1, $2, $3)`,
        [id_test, id_jugador, parseFloat(valor)]
      )
    );

    await Promise.all(inserts);

    res.json({ success: true, id_test });
  } catch (err) {
    console.error('❌ Error al crear test:', err);
    res.status(500).json({ success: false, error: 'Error servidor' });
  }
});


// 2) EDITAR TEST
app.patch('/tests/:id', async (req, res) => {
  const id = req.params.id;
  const { titulo, descripcion, tipo, fecha, equipo, resultados } = req.body;

  if (!titulo || !fecha || !equipo) {
    return res.status(400).json({ success: false, error: 'Faltan datos obligatorios' });
  }

  try {
    await pool.query(
      `UPDATE tests_fisicos
       SET titulo = $1, descripcion = $2, tipo = $3, fecha = $4, equipo = $5
       WHERE id = $6`,
      [titulo, descripcion || null, tipo || null, fecha, equipo, id]
    );

    // Borramos resultados anteriores y reinsertamos
    if (Array.isArray(resultados) && resultados.length > 0) {
  await pool.query(`DELETE FROM resultados_tests WHERE id_test = $1`, [id]);

  const inserts = resultados.map(({ id_jugador, valor }) =>
    pool.query(
      `INSERT INTO resultados_tests (id_test, id_jugador, valor)
       VALUES ($1, $2, $3)`,
      [id, id_jugador, parseFloat(valor)]
    )
  );

  await Promise.all(inserts);
}

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error al editar test:', err);
    res.status(500).json({ success: false, error: 'Error servidor' });
  }
});

// 3) BORRAR TEST
app.delete('/tests/:id', async (req, res) => {
  const id = req.params.id;

  try {
    await pool.query(`DELETE FROM tests_fisicos WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error al eliminar test:', err);
    res.status(500).json({ success: false, error: 'Error servidor' });
  }
});

// 4) OBTENER TESTS POR EQUIPO (con resultados incluidos)
app.get('/tests/:equipo', async (req, res) => {
  const { equipo } = req.params;

  try {
    const result = await pool.query(
      `SELECT * FROM tests_fisicos WHERE equipo = $1 ORDER BY fecha DESC`,
      [equipo]
    );
    const tests = result.rows;

    // Añadir resultados a cada test
    for (const test of tests) {
      const resul = await pool.query(`
        SELECT r.valor, r.id_jugador, j.apodo
        FROM resultados_tests r
        JOIN jugadores j ON j.id = r.id_jugador
        WHERE r.id_test = $1
      `, [test.id]);

      test.resultados = resul.rows;
    }

    res.json({ success: true, tests });
  } catch (err) {
    console.error('❌ Error al obtener tests:', err);
    res.status(500).json({ success: false, error: 'Error servidor' });
  }
});

// 5) COMPARAR TESTS
//  Devuelve datos de varios tests con resultados y apodos
app.post('/comparartests', async (req, res) => {
  const { ids } = req.body;

  if (!Array.isArray(ids) || ids.length < 2) {
    return res.status(400).json({ success: false, error: 'IDs inválidos' });
  }

  try {
    const tests = [];

    for (const id of ids) {
      const testRes = await pool.query('SELECT * FROM tests_fisicos WHERE id = $1', [id]);
      const test = testRes.rows[0];

      const resultadosRes = await pool.query(`
        SELECT r.valor, j.apodo, r.id_jugador
        FROM resultados_tests r
        JOIN jugadores j ON j.id = r.id_jugador
        WHERE r.id_test = $1
      `, [id]);

      test.resultados = resultadosRes.rows;
      tests.push(test);
    }

    res.json({ success: true, tests });
  } catch (err) {
    console.error("❌ Error al obtener comparación:", err);
    res.status(500).json({ success: false, error: 'Error servidor' });
  }
});

////////////////////////////////
//REPOSITORIO PREPARACION FISICA
////////////////////////////////

app.post('/repositoriofisico/subir', uploadRepoFisico.single('archivo'), async (req, res) => {
  const { equipo, semana, dia, bloque, nombre, creado_por } = req.query;
  const filePath = path.relative(__dirname, req.file.path);

  try {
    const result = await pool.query(
      `INSERT INTO repositorio_fisico (equipo, semana, dia, nombre, ruta, creado_por)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [equipo, semana, dia, nombre, filePath, creado_por]
    );
    res.json({ success: true, archivo: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.get('/repositoriofisico/:equipo', async (req, res) => {
  const equipo = req.params.equipo;
  try {
    const archivos = await pool.query(
      `SELECT * FROM repositorio_fisico WHERE equipo = $1 ORDER BY semana,
  CASE 
    WHEN dia = 'Lunes' THEN 1
    WHEN dia = 'Martes' THEN 2
    WHEN dia = 'Miercoles' THEN 3
    WHEN dia = 'Jueves' THEN 4
    WHEN dia = 'Viernes' THEN 5
    WHEN dia = 'GuíaBloque' THEN 0
    ELSE 99
  END`,
      [equipo]
    );
    res.json({ success: true, archivos: archivos.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.delete('/repositoriofisico/:id', async (req, res) => {
  const id = req.params.id;
  try {
    const result = await pool.query(
      `DELETE FROM repositorio_fisico WHERE id = $1 RETURNING ruta`,
      [id]
    );
    if (result.rowCount === 0) return res.status(404).json({ success: false });
    fs.unlink(path.join(__dirname, result.rows[0].ruta), () => {});
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

app.post('/repositoriofisico/guia', uploadRepoFisico.single('archivo'), async (req, res) => {
  const { equipo, bloque, nombre, creado_por } = req.body;
  const semana = (bloque - 1) * 4 + 1; // Semana inicial del bloque
  const filePath = path.relative(__dirname, req.file.path);

  try {
    const result = await pool.query(
      `INSERT INTO repositorio_fisico (equipo, semana, dia, nombre, ruta, creado_por)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [equipo, semana, 'GuíaBloque', nombre, filePath, creado_por]
    );
    res.json({ success: true, archivo: result.rows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
});

////////////////////////////////
//  METODOLOGÍA
////////////////////////////////

app.post('/reuniones-metodologia', uploadMetodologia.array('archivos', 5), async (req, res) => {
  const { titulo, descripcion, fecha, creado_por } = req.body;

  if (!titulo || !fecha || !creado_por || req.files.length === 0) {
    return res.status(400).json({ success: false, error: 'Faltan datos obligatorios' });
  }

  try {
    const { rows } = await pool.query(
      `INSERT INTO reuniones_metodologia (titulo, descripcion, fecha, creado_por)
       VALUES ($1, $2, $3, $4) RETURNING id`,
      [titulo, descripcion, fecha, creado_por]
    );
    const reunionId = rows[0].id;

    for (const archivo of req.files) {
      const rutaRelativa = path.relative(__dirname, archivo.path);
      await pool.query(
        `INSERT INTO archivos_reunion (reunion_id, nombre, ruta)
         VALUES ($1, $2, $3)`,
        [reunionId, archivo.originalname, rutaRelativa]
      );
    }

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error al crear reunión metodología:", err);
    res.status(500).json({ success: false });
  }
});

app.get('/reuniones-metodologia', async (req, res) => {
  try {
    const { rows } = await pool.query(`
      SELECT r.id, r.titulo, r.descripcion, r.fecha,
             r.creado_por, u.nombre AS creador_nombre, u.rol AS creador_rol,
             COALESCE(json_agg(json_build_object('nombre', a.nombre, 'ruta', a.ruta)) FILTER (WHERE a.id IS NOT NULL), '[]') AS archivos
        FROM reuniones_metodologia r
        JOIN usuarios u ON r.creado_por = u.id
        LEFT JOIN archivos_reunion a ON r.id = a.reunion_id
       GROUP BY r.id, u.nombre, u.rol
       ORDER BY r.fecha DESC
    `);

    res.json({ success: true, reuniones: rows });
  } catch (err) {
    console.error("❌ Error al listar reuniones:", err);
    res.status(500).json({ success: false });
  }
});

app.delete('/reuniones-metodologia/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const archivos = await pool.query(
      `SELECT ruta FROM archivos_reunion WHERE reunion_id = $1`,
      [id]
    );

    for (const a of archivos.rows) {
      const filePath = path.join(__dirname, a.ruta);
      fs.unlink(filePath, err => {
        if (err) console.warn("⚠️ Error borrando archivo físico:", filePath);
      });
    }

    await pool.query(`DELETE FROM reuniones_metodologia WHERE id = $1`, [id]);

    res.json({ success: true });
  } catch (err) {
    console.error("❌ Error al eliminar reunión:", err);
    res.status(500).json({ success: false });
  }
});


////////////////////////////////
// RPE PREPARACION FISICA
////////////////////////////////
app.post('/rpe', async (req, res) => {
  const { equipo, mes, semana, dia, datos, creado_por } = req.body;

  if (!equipo || !mes || !semana || !dia || !Array.isArray(datos)) {
    return res.status(400).json({ success: false, error: 'Datos incompletos o malformateados' });
  }

  try {
    const inserts = datos.map(({ jugador_id, valor }) => {
      return pool.query(
        `INSERT INTO rpe (jugador_id, equipo, mes, semana, dia, valor, creado_por)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [jugador_id, equipo, mes, semana, dia, valor, creado_por]
      );
    });

    await Promise.all(inserts);

    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error guardando RPE:', err);
    res.status(500).json({ success: false, error: 'Error al guardar RPE' });
  }
});

app.get('/rpe/:equipo', async (req, res) => {
  const { equipo } = req.params;

  try {
    const { rows } = await pool.query(
      `SELECT r.*, j.apodo
       FROM rpe r
       JOIN jugadores j ON j.id = r.jugador_id
       WHERE r.equipo = $1
       ORDER BY mes, semana, dia`,
      [equipo]
    );

    res.json({ success: true, rpe: rows });
  } catch (err) {
    console.error('❌ Error listando RPE:', err);
    res.status(500).json({ success: false, error: 'Error al obtener RPE' });
  }
});

// Borrar todos los RPE de un día concreto (mes + semana + dia + equipo)
app.delete('/rpe', async (req, res) => {
  const { equipo, mes, semana, dia } = req.body;

  try {
    await pool.query(
      `DELETE FROM rpe WHERE equipo = $1 AND mes = $2 AND semana = $3 AND dia = $4`,
      [equipo, mes, semana, dia]
    );
    res.json({ success: true });
  } catch (err) {
    console.error('❌ Error al borrar RPE:', err);
    res.status(500).json({ success: false, error: 'Error al borrar RPE' });
  }
});


////////////////////////////////
// CUENTAS
////////////////////////////////

app.get('/cuotas/:equipo', async (req, res) => {
  const equipo = req.params.equipo.toLowerCase();
  const temporada = '2025-2026'; // puedes parametrizarla en el futuro

  try {
    const jugadores = await pool.query(
      `SELECT j.id, j.apodo, j.equipo, 
              c.pago1, c.pago2, c.pago3
         FROM jugadores j
    LEFT JOIN cuotas c ON c.jugador_id = j.id AND c.temporada = $1
        WHERE j.equipo::text ILIKE $2`,
      [temporada, equipo]
    );

    res.json({ success: true, jugadores: jugadores.rows });
  } catch (err) {
    console.error('Error al obtener cuotas:', err);
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});

app.post('/cuotas/actualizar', async (req, res) => {
  const { jugador_id, equipo, pagoIndex, valor } = req.body;
  const temporada = '2025-2026';

  if (![0, 1, 2].includes(pagoIndex)) {
    return res.status(400).json({ success: false, error: 'Pago inválido' });
  }

  const campoPago = `pago${pagoIndex + 1}`;

  try {
    // Asegura que exista un registro
    await pool.query(
      `INSERT INTO cuotas (jugador_id, equipo, temporada)
       VALUES ($1, $2, $3)
       ON CONFLICT (jugador_id, equipo, temporada)
       DO NOTHING`,
      [jugador_id, equipo, temporada]
    );

    // Actualiza el pago
    await pool.query(
      `UPDATE cuotas
       SET ${campoPago} = $1
       WHERE jugador_id = $2 AND equipo = $3 AND temporada = $4`,
      [valor, jugador_id, equipo, temporada]
    );

    res.json({ success: true });
  } catch (err) {
    console.error('Error al actualizar cuota:', err);
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});

app.get('/cuotas/pendientes/:equipo', async (req, res) => {
  const equipo = req.params.equipo.toLowerCase();
  const temporada = '2025-2026';

  try {
    const result = await pool.query(
      `SELECT j.apodo,
              c.pago1, c.pago2, c.pago3
         FROM jugadores j
    LEFT JOIN cuotas c ON c.jugador_id = j.id AND c.temporada = $1
        WHERE j.equipo::text ILIKE $2`,
      [temporada, equipo]
    );

    const pendientes = result.rows.filter(j =>
      !j.pago1 || !j.pago2 || !j.pago3
    );

    res.json({ success: true, jugadores: pendientes });
    // Más adelante puedes usar pdfkit o similar para generar y enviar PDF
  } catch (err) {
    console.error('Error al obtener pendientes:', err);
    res.status(500).json({ success: false, error: 'Error interno' });
  }
});




app.post('/generar-pdf-cuotas', async (req, res) => {
  const { jugadores, equipo, temporada } = req.body;

  try {
    const doc = new PDFDocument({ margin: 50 });
    const filePath = path.join(__dirname, 'pendientes_cuotas.pdf');
    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Título
    doc.fillColor('#222222')
      .fontSize(20)
      .text(`Jugadores con pagos pendientes – ${equipo.toUpperCase()}`, { align: 'center' })
      .moveDown(1);

    // Cabecera
    const startX = 50;
    const colWidths = [150, 250, 150];
    const colY = doc.y;

    // Fondo de cabecera
    doc.rect(startX, colY, colWidths.reduce((a, b) => a + b), 24)
      .fill('#c53030');

    // Texto cabecera
    doc
      .fillColor('#ffffff')
      .font('Helvetica-Bold')
      .fontSize(12)
      .text('Jugador', startX + 5, colY + 6, { width: colWidths[0] - 10, align: 'left' })
      .text('Pagos pendientes', startX + colWidths[0] + 5, colY + 6, { width: colWidths[1] - 10, align: 'left' })
      .text('Total pendiente (€)', startX + colWidths[0] + colWidths[1] + 5, colY + 6, { width: colWidths[2] - 10, align: 'left' });

    doc.moveDown(2);
    doc.fillColor('#000000').font('Helvetica').fontSize(11);

    const precios = obtenerPrecios(equipo);

    jugadores.forEach(j => {
      const pagos = [];
      let total = 0;
      if (!j.pago1) { pagos.push('Pago 1'); total += precios[0]; }
      if (!j.pago2) { pagos.push('Pago 2'); total += precios[1]; }
      if (!j.pago3) { pagos.push('Pago 3'); total += precios[2]; }

      const y = doc.y;
      doc.fillColor('#fef2f2').rect(startX, y, colWidths.reduce((a, b) => a + b), 20).fill('#fef2f2');

      doc
        .fillColor('#000000')
        .font('Helvetica-Bold')
        .text(j.apodo?.toUpperCase() || j.nombre?.toUpperCase() || '—', startX + 5, y + 5, { width: colWidths[0] - 10, align: 'left' })
        .font('Helvetica')
        .text(pagos.join(', '), startX + colWidths[0] + 5, y + 5, { width: colWidths[1] - 10, align: 'left' })
        .text(`${total}€`, startX + colWidths[0] + colWidths[1] + 5, y + 5, { width: colWidths[2] - 10, align: 'left' });

      doc.moveDown(1.2);
    });

    // Pie de página
    doc.moveDown(2);
    doc.fontSize(10).fillColor('#555').text(`Temporada: ${temporada} – Generado el ${new Date().toLocaleDateString('es-ES')}`, {
      align: 'center',
    });

    doc.end();

    stream.on('finish', () => {
      res.sendFile(filePath);
    });
  } catch (err) {
    console.error('Error generando PDF:', err);
    res.status(500).json({ success: false, error: 'No se pudo generar el PDF' });
  }
});







function obtenerPrecios(equipo) {
  const equipos450 = [
    'prebenjamina', 'prebenjaminb', 'prebenjaminc',
    'benjamina', 'benjaminb', 'benjaminc'
  ];
  if (equipos450.includes(equipo.toLowerCase())) return [150, 150, 150];
  return [145, 200, 200];
}







////////////////////////////////
// SCOUT
////////////////////////////////

app.post('/scout', async (req, res) => {
  const {
  nombre: nombre_completo,
  club,
  lateralidad,
  posicion: posicion_principal,
  contacto,
  valoracion,
  descripcion,
  anio_nacimiento
} = req.body;

  if (!nombre_completo || !club || !posicion_principal || !valoracion || !anio_nacimiento) {
  return res.status(400).json({ success: false, error: 'Faltan campos obligatorios' });
}

  try {
    await pool.query(
  `INSERT INTO jugadores_scout 
    (nombre_completo, club, lateralidad, posicion_principal, contacto, valoracion, descripcion, anio_nacimiento)
   VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`,
  [nombre_completo, club, lateralidad, posicion_principal, contacto, valoracion, descripcion, anio_nacimiento]
);

    res.json({ success: true });
  } catch (err) {
    console.error('Error al crear jugador scout:', err);
    res.status(500).json({ success: false, error: 'Error servidor' });
  }
});


app.get('/scout/:nacimiento', async (req, res) => {
  const anio = parseInt(req.params.nacimiento, 10);
  try {
    const result = await pool.query(
      `SELECT * FROM jugadores_scout WHERE anio_nacimiento = $1 ORDER BY nombre_completo`,
      [anio]
    );
    res.json({ success: true, jugadores: result.rows });
  } catch (err) {
    console.error('Error al obtener jugadores scout:', err);
    res.status(500).json({ success: false });
  }
});


// Obtener todas las posiciones desde el enum 'posicion'
app.get('/posiciones', async (req, res) => {
  try {
    const resultado = await pool.query(
      `SELECT unnest(enum_range(NULL::posicion)) AS posicion`
    );
    const posiciones = resultado.rows.map(r => r.posicion);
    res.json({ success: true, posiciones });
  } catch (err) {
    console.error('Error al listar posiciones:', err);
    res.status(500).json({ success: false, error: 'Error al listar posiciones' });
  }
});


app.post('/scout/pdf', async (req, res) => {
  const jugador = req.body;

  try {
    // Creamos buffer para almacenar PDF
    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    const chunks = [];

    // Escuchamos datos
    doc.on('data', chunk => chunks.push(chunk));
    doc.on('end', () => {
      const pdfBuffer = Buffer.concat(chunks);
      res.setHeader('Content-Disposition', `attachment; filename=informe_${jugador.nombre_completo.replace(/\s+/g, '_')}.pdf`);
      res.setHeader('Content-Type', 'application/pdf');
      res.send(pdfBuffer);
    });

    // ✅ NO HAY console.log antes de .end()

    // Fuente base
    doc.font('Helvetica');

    // Título
    doc
      .fillColor('#c53030')
      .fontSize(22)
      .text('Informe de Jugador en Seguimiento', { align: 'center' })
      .moveDown(1.5);

    // Datos
    const campos = [
      { label: 'Nombre completo', value: jugador.nombre_completo },
      { label: 'Club actual', value: jugador.club },
      { label: 'Año de nacimiento', value: jugador.anio_nacimiento },
      { label: 'Lateralidad', value: jugador.lateralidad },
      { label: 'Posición principal', value: jugador.posicion_principal },
      { label: 'Teléfono de contacto', value: jugador.contacto || 'No indicado' },
    ];

    campos.forEach(({ label, value }) => {
      doc
        .fontSize(12)
        .fillColor('#333')
        .text(`${label}: `, { continued: true })
        .fillColor('#000')
        .text(value)
        .moveDown(0.3);
    });

    const coloresValoracion = {
      A: '#2f855a',
      B: '#d69e2e',
      C: '#c53030',
    };

    doc
      .moveDown()
      .fontSize(14)
      .fillColor('#333')
      .text('Valoración:', { continued: true })
      .font('Helvetica-Bold')
      .fillColor(coloresValoracion[jugador.valoracion] || '#000')
      .text(`  ${jugador.valoracion}`)
      .moveDown();

    doc
      .fontSize(13)
      .fillColor('#555')
      .text('Observaciones:', { underline: true })
      .moveDown(0.5)
      .fontSize(12)
      .fillColor('#000')
      .text(jugador.descripcion || '—', { lineGap: 4 })
      .moveDown(2);

    doc
      .fontSize(10)
      .fillColor('#999')
      .text(`Generado por el Departamento de Scouting de la Cantera de Unionistas de Salamanca C.F el ${new Date().toLocaleDateString('es-ES')}`, { align: 'center' });

    doc.end();
  } catch (err) {
    console.error('Error generando PDF:', err);
    res.status(500).json({ success: false, error: 'No se pudo generar el PDF' });
  }
});



app.delete('/scout/:id', async (req, res) => {
  const id = parseInt(req.params.id, 10);

  try {
    await pool.query(`DELETE FROM jugadores_scout WHERE id = $1`, [id]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error al eliminar jugador scout:', err);
    res.status(500).json({ success: false, error: 'Error al eliminar jugador' });
  }
});


//////////////////////////////////////////////////////////////////////////


app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
// Verificación de conexión a PostgreSQL
pool.query("SELECT NOW()", (err, result) => {
  if (err) {
    console.error("Error en la conexión", err);
  } else {
    console.log("Conexión exitosa a PostgreSQL en:", result.rows[0].now);
  }
});
