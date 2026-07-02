// app/login/page.js
'use client'
import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function Login() {
  const [usuario, setUsuario] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState('')
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')

    // Buscar el usuario en la tabla profiles
    const { data: perfil, error: dbError } = await supabase
      .from('profiles')
      .select('*')
      .eq('usuario', usuario)
      .eq('clave', clave)
      .single()

    if (dbError || !perfil) {
      setError('Usuario o contraseña incorrectos.')
    } else {
      // Guardamos los datos de sesión de forma simple en el navegador
      localStorage.setItem('barbero_sesion', JSON.stringify(perfil))
      router.push('/admin')
    }
  }

  return (
    <main className="max-w-md mx-auto mt-20 p-6 bg-white rounded-2xl shadow-xl text-slate-800 border">
      <h1 className="text-2xl font-black mb-6 text-center text-slate-900">Ingreso Personal</h1>
      <form onSubmit={handleLogin} className="space-y-4">
        <input type="email" placeholder="Correo Usuario" required value={usuario} onChange={e => setUsuario(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none" />
        <input type="password" placeholder="Contraseña" required value={clave} onChange={e => setClave(e.target.value)} className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:outline-none" />
        <button type="submit" className="w-full bg-black text-white p-3 rounded-xl font-bold hover:bg-slate-800 transition-colors">Ingresar</button>
      </form>
      {error && <p className="mt-4 text-center text-red-600 text-sm font-semibold">{error}</p>}
    </main>
  )
}