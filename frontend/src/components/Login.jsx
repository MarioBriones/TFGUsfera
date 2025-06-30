import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

/**
 * Componente de formulario de inicio de sesión.
 * @function Login
 * @returns {JSX.Element} Vista de login con validación y redirección
 */
function Login() {
  const [email, setEmail] = useState('');
  const [clave, setClave] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();
  const location = useLocation();

  const redirigido = location.state?.desdeRutaPrivada;
/**
 * Maneja el proceso de autenticación con email y contraseña.
 * @function handleLogin
 * @param {React.FormEvent} e - Evento de envío del formulario
 * @returns {Promise<void>}
 */
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, clave }),
      });
      const data = await res.json();
      if (data.success) {
  localStorage.setItem('usuario', JSON.stringify(data.usuario));
  navigate('/home', { state: { usuario: data.usuario } });
} else {
  // Si hay mensaje personalizado (como en rate-limit), úsalo
  setError(data.message || 'Credenciales incorrectas');
}
    } catch (err) {
      console.error('Error al hacer login:', err);
      setError('Error del servidor');
    }
  };

  return (
    <div
      className="flex flex-col items-center justify-center min-h-screen px-4 sm:px-6 lg:px-8 bg-cover bg-center overflow-hidden"
      style={{
        backgroundImage: `url('${import.meta.env.BASE_URL}texturas.png')`,
      }}
    >
      <div
        className="absolute inset-0 mix-blend-overlay opacity-10"
        style={{
          backgroundImage: `url('${import.meta.env.BASE_URL}logo.png')`,
          backgroundRepeat: 'repeat',
        }}
      />

      <h1 className="relative text-5xl sm:text-7xl md:text-8xl lg:text-[6rem] font-extrabold text-white drop-shadow-lg mb-8 text-center">
        USFERA
      </h1>

      <Card className="relative w-full max-w-md sm:max-w-lg md:max-w-xl bg-white/20 backdrop-blur-md shadow-2xl">
        <CardHeader className="flex flex-col items-center py-6 sm:py-8 px-6 sm:px-8 bg-transparent">
          <img
            src={`${import.meta.env.BASE_URL}logo2.png`}
            alt="Escudo Unionistas"
            className="h-32 w-32 sm:h-40 sm:w-40 mb-4"
          />
          <CardTitle className="text-xl sm:text-2xl md:text-3xl font-bold text-white drop-shadow">
            Gestión y administración
          </CardTitle>
          <CardDescription className="mt-1 text-center text-sm sm:text-base text-white/80 max-w-xs drop-shadow">
            Cantera de Unionistas de Salamanca CF
          </CardDescription>
        </CardHeader>

        <CardContent className="px-6 sm:px-8 py-6 sm:py-8">
          {redirigido && (
            <p className="mb-4 text-center text-yellow-200 font-semibold drop-shadow">
              ⚠️ Debes iniciar sesión para acceder a esa sección.
            </p>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="email"
              placeholder="Correo electrónico"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 sm:py-4 border border-white/50 bg-white/30 text-white placeholder-white/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <input
              type="password"
              placeholder="Contraseña"
              value={clave}
              onChange={(e) => setClave(e.target.value)}
              required
              className="w-full px-4 py-3 sm:py-4 border border-white/50 bg-white/30 text-white placeholder-white/70 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-400"
            />
            <Button
              type="submit"
              variant="default"
              className="w-full py-3 sm:py-4 text-lg"
            >
              ACCEDER
            </Button>
          </form>
          {error && (
            <p className="mt-4 text-center text-red-400 font-medium drop-shadow">
              {error}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default Login;