import React from 'react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function ComponentsGallery() {
  return (
    <div className="min-h-screen bg-gray-50 p-8 space-y-12">
      {/* ==== TYPOGRAPHY ==== */}
      <section>
        <h2 className="text-3xl font-extrabold mb-4">🔤 Tipografía</h2>
        <div className="space-y-2">
          <h1 className="text-5xl font-black">Heading 1 / 5xl</h1>
          <h2 className="text-4xl font-bold">Heading 2 / 4xl</h2>
          <h3 className="text-3xl font-semibold">Heading 3 / 3xl</h3>
          <p className="text-base text-gray-700">
            Párrafo normal / base. Aquí se muestra texto de muestra para ver estilos.
          </p>
        </div>
      </section>

      {/* ==== BUTTONS ==== */}
      <section>
        <h2 className="text-3xl font-extrabold mb-4">🔘 Botones</h2>
        <div className="flex flex-wrap gap-4">
          <Button variant="default">Default</Button>
          <Button variant="destructive">Destructive</Button>
          <Button variant="outline">Outline</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="link">Link</Button>
        </div>
      </section>

      {/* ==== CARDS ==== */}
      <section>
        <h2 className="text-3xl font-extrabold mb-4">🗂️ Cards</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card básica */}
          <Card>
            <CardHeader>
              <CardTitle>Card Básica</CardTitle>
              <CardDescription>Descripción corta.</CardDescription>
            </CardHeader>
            <CardContent>
              Contenido de la card. Aquí puedes poner texto, imágenes… lo que necesites.
            </CardContent>
            <CardFooter>
              <Button variant="link">Acción</Button>
            </CardFooter>
          </Card>

          {/* Card con fondo personalizado */}
          <Card className="bg-blue-50">
            <CardHeader>
              <CardTitle>Card Azul</CardTitle>
              <CardDescription>Fondo azul suave.</CardDescription>
            </CardHeader>
            <CardContent>
              Usa `className="bg-blue-50"` para cambiar el fondo.
            </CardContent>
            <CardFooter>
              <Button variant="secondary">Aceptar</Button>
            </CardFooter>
          </Card>

          {/* Card con sombra extra */}
          <Card className="shadow-2xl">
            <CardHeader>
              <CardTitle>Card Sombra</CardTitle>
            </CardHeader>
            <CardContent>
              Añade `className="shadow-2xl"` para elevarla aún más.
            </CardContent>
            <CardFooter>
              <Button variant="default">Ver más</Button>
            </CardFooter>
          </Card>
        </div>
      </section>

      {/* ==== FORM ELEMENTS ==== */}
      <section>
        <h2 className="text-3xl font-extrabold mb-4">📝 Form Elements</h2>
        <form className="space-y-4 max-w-md">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              placeholder="ejemplo@correo.com"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="********"
              className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Selección
            </label>
            <select className="w-full px-4 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option>Opción 1</option>
              <option>Opción 2</option>
            </select>
          </div>
          <Button variant="default">Enviar Formulario</Button>
        </form>
      </section>
    </div>
  );
}
