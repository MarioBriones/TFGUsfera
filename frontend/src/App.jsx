import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import RutaPrivada from './components/RutaPrivada';
import Login from './components/Login';
import Inicio from './components/Inicio';
import Repositorio from './components/Repositorio';
import Plantilla from './components/Plantilla';
import PreparacionFisica from './components/PreparacionFisica';
import Tests from './components/Tests';
import RepFisico from './components/RepFisico';
import Metodologia from './components/Metodologia';
import Rpe from './components/Rpe';
import Cuentas from './components/Cuentas';
import Scout from './components/Scout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/home" element={<RutaPrivada><Inicio /></RutaPrivada>} />
        <Route path="/repositorio" element={<RutaPrivada><Repositorio /></RutaPrivada>} />
        <Route path="/plantilla" element={<RutaPrivada><Plantilla /></RutaPrivada>} />
        <Route path="/plantillas" element={<RutaPrivada><Plantilla /></RutaPrivada>} />
        <Route path="/prep.física" element={<RutaPrivada><PreparacionFisica /></RutaPrivada>} />
        <Route path="/testsfisicos" element={<RutaPrivada><Tests /></RutaPrivada>} />
        <Route path="/repositoriofisico" element={<RutaPrivada><RepFisico /></RutaPrivada>} />
        <Route path="/metodología" element={<RutaPrivada><Metodologia /></RutaPrivada>} />
        <Route path="/rpe" element={<RutaPrivada><Rpe /></RutaPrivada>} />
        <Route path="/scout" element={<RutaPrivada><Scout /></RutaPrivada>} />
        <Route path="/cuentas" element={<RutaPrivada><Cuentas /></RutaPrivada>} />
        <Route path="*" element={<div className="p-8">Página no encontrada</div>} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;

