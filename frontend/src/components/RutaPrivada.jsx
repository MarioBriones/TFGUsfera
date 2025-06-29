import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

export default function RutaPrivada({ children }) {
  const location = useLocation();
  const usuario = location.state?.usuario || JSON.parse(localStorage.getItem('usuario'));

  if (!usuario) {
    return (
      <Navigate
        to="/"
        replace
        state={{ desdeRutaPrivada: true }}
      />
    );
  }

  return children;
}