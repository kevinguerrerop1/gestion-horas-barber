// app/admin/page.js
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AdminPanel() {
  const [citas, setCitas] = useState([])
  const [perfil, setPerfil] = useState(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  // Estados para Barberos
  const [nuevoNombre, setNuevoNombre] = useState('')
  const [nuevoUsuario, setNuevoUsuario] = useState('')
  const [nuevaClave, setNuevaClave] = useState('')
  const [listaBarberos, setListaBarberos] = useState([])

  // Estados para Servicios
  const [nombreServicio, setNombreServicio] = useState('')
  const [precioServicio, setPrecioServicio] = useState('')
  const [listaServicios, setListaServicios] = useState([])
  const [idServicioEditando, setIdServicioEditando] = useState(null)
  const [precioEditando, setPrecioEditando] = useState('')

  useEffect(() => {
    const sesionGuardada = localStorage.getItem('barbero_sesion')
    if (!sesionGuardada) {
      router.push('/login')
      return
    }
    
    const userPerfil = JSON.parse(sesionGuardada)
    setPerfil(userPerfil)
    setLoading(false)
    
    cargarDatos(userPerfil)
  }, [])

  async function cargarDatos(userPerfil) {
    let query = supabase.from('citas').select('*, servicios(nombre, precio)')
    
    if (!userPerfil.es_admin) {
      query = query.eq('barbero_id', userPerfil.id)
    }
    const { data: listaCitas, error: errorCitas } = await query.order('fecha', { ascending: true })

    if (errorCitas) {
      console.error('Error al cargar citas:', errorCitas.message)
      return
    }

    const { data: todosLosPerfiles } = await supabase.from('profiles').select('id, nombre')
    
    const mapaBarberos = {}
    todosLosPerfiles?.forEach(p => {
      mapaBarberos[p.id] = p.nombre
    })

    const citasFormateadas = (listaCitas || []).map(cita => ({
      ...cita,
      nombre_barbero: mapaBarberos[cita.barbero_id] || `ID: ${cita.barbero_id}`
    }))

    setCitas(citasFormateadas)

    if (userPerfil.es_admin) {
      const { data: barberos } = await supabase.from('profiles').select('*').eq('es_admin', false)
      setListaBarberos(barberos || [])

      const { data: servs } = await supabase.from('servicios').select('*').order('nombre', { ascending: true })
      setListaServicios(servs || [])
    }
  }

  const formatearFecha = (fechaString) => {
    if (!fechaString) return ''
    const partes = fechaString.split('-')
    if (partes.length !== 3) return fechaString
    return `${partes[2]}/${partes[1]}/${partes[0]}`
  }

  // --- ACCIONES DE BARBEROS ---
  const handleCrearBarbero = async (e) => {
    e.preventDefault()
    const nuevoId = crypto.randomUUID()
    const { error } = await supabase.from('profiles').insert([
      { id: nuevoId, nombre: nuevoNombre, usuario: nuevoUsuario, clave: nuevaClave, es_admin: false }
    ])

    if (error) alert('Error: ' + error.message)
    else {
      alert('¡Barbero creado!')
      setNuevoNombre(''); setNuevoUsuario(''); setNuevaClave('')
      cargarDatos(perfil)
    }
  }

  const handleEliminarBarbero = async (id) => {
    if (!confirm('¿Seguro que deseas eliminar a este barbero? Se borrarán sus datos de perfil.')) return
    
    const { error } = await supabase.from('profiles').delete().eq('id', id)
    if (error) alert('Error al eliminar: ' + error.message)
    else {
      alert('Barbero eliminado del sistema.')
      cargarDatos(perfil)
    }
  }

  // --- ACCIONES DE SERVICIOS ---
  const handleCrearServicio = async (e) => {
    e.preventDefault()
    const { error } = await supabase.from('servicios').insert([
      { nombre: nombreServicio, precio: parseInt(precioServicio) }
    ])

    if (error) alert('Error: ' + error.message)
    else {
      alert('¡Servicio agregado!')
      setNombreServicio(''); setPrecioServicio('')
      cargarDatos(perfil)
    }
  }

  const handleActualizarPrecio = async (id) => {
    if (!precioEditando) return

    const { error } = await supabase
      .from('servicios')
      .update({ precio: Number(precioEditando) })
      .eq('id', id)

    if (error) {
      alert('Error al actualizar: ' + error.message)
    } else {
      alert('¡Precio actualizado con éxito!')
      setIdServicioEditando(null)
      setPrecioEditando('')
      await cargarDatos(perfil)
    }
  }

  const handleEliminarServicio = async (id) => {
    if (!confirm('¿Seguro que deseas eliminar este servicio del catálogo?')) return

    const { error } = await supabase.from('servicios').delete().eq('id', id)
    if (error) alert('Error al eliminar: ' + error.message)
    else {
      alert('Servicio eliminado.')
      cargarDatos(perfil)
    }
  }

  if (loading) return <div className="text-center mt-20 text-slate-500 font-medium">Iniciando panel seguro...</div>

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4 sm:p-6 md:p-10 selection:bg-amber-500 selection:text-black">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Cabecera Estilo Control Room */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-900/60 border border-slate-800/80 backdrop-blur-md p-6 rounded-3xl shadow-xl">
          <div className="space-y-1">
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white uppercase">
              {perfil.es_admin ? 'Control' : 'Agenda'} <span className="text-amber-500">Panel</span>
            </h1>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" />
              <p className="text-xs font-bold tracking-widest text-slate-400 uppercase">
                {perfil.es_admin ? '📍 Administrador General' : `💈 Especialista: ${perfil.nombre}`}
              </p>
            </div>
          </div>
          
          <button 
            onClick={() => { localStorage.removeItem('barbero_sesion'); router.push('/login') }} 
            className="w-full sm:w-auto text-center px-5 py-2.5 rounded-xl text-xs font-black tracking-widest uppercase bg-slate-950 border border-slate-800 text-slate-300 hover:text-white hover:border-amber-500 hover:bg-amber-500/5 transition-all duration-200"
          >
            Cerrar Sesión
          </button>
        </div>

        {/* Distribución en Grid Responsiva */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* SECCIÓN DE MANTENEDORES (Exclusivo Administradores) */}
          {perfil.es_admin && (
            <div className="space-y-6 lg:col-span-1 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-6 md:gap-4 lg:space-y-6">
              
              {/* Bloque Barberos */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
                <h2 className="text-xs font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
                  <span>💈</span> Registro de Personal
                </h2>
                <form onSubmit={handleCrearBarbero} className="space-y-3">
                  <input type="text" placeholder="Nombre de Trabajo" required value={nuevoNombre} onChange={e => setNuevoNombre(e.target.value)} className="w-full bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors" />
                  <input type="email" placeholder="Usuario / Email" required value={nuevoUsuario} onChange={e => setNuevoUsuario(e.target.value)} className="w-full bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors" />
                  <input type="text" placeholder="Contraseña de Acceso" required value={nuevaClave} onChange={e => setNuevaClave(e.target.value)} className="w-full bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors" />
                  <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-black p-3 rounded-xl text-xs font-black tracking-wider uppercase transition-colors shadow-lg shadow-amber-500/5">
                    Dar de Alta
                  </button>
                </form>
                
                <div className="space-y-1.5 pt-3 border-t border-slate-800/60 max-h-44 overflow-y-auto custom-scrollbar">
                  {listaBarberos.map(b => (
                    <div key={b.id} className="p-3 bg-slate-950/80 rounded-xl border border-slate-900 flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-300">{b.nombre}</span>
                      <button type="button" onClick={() => handleEliminarBarbero(b.id)} className="text-rose-400 hover:text-rose-300 font-bold transition-colors px-2">
                        Baja
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Bloque Servicios */}
              <div className="bg-slate-900/40 border border-slate-900 rounded-3xl p-5 sm:p-6 space-y-4 shadow-xl">
                <h2 className="text-xs font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
                  <span>✂️</span> Menú & Precios
                </h2>
                <form onSubmit={handleCrearServicio} className="space-y-3">
                  <input type="text" placeholder="Nombre del Servicio" required value={nombreServicio} onChange={e => setNombreServicio(e.target.value)} className="w-full bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors" />
                  <input type="number" placeholder="Precio de Lista ($)" required value={precioServicio} onChange={e => setPrecioServicio(e.target.value)} className="w-full bg-slate-950 border border-slate-800/80 rounded-xl p-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-amber-500 transition-colors" />
                  <button type="submit" className="w-full bg-slate-100 hover:bg-white text-black p-3 rounded-xl text-xs font-black tracking-wider uppercase transition-colors">
                    Añadir Servicio
                  </button>
                </form>
                
                <div className="space-y-2 pt-3 border-t border-slate-800/60 max-h-48 overflow-y-auto custom-scrollbar">
                  {listaServicios.map(s => (
                    <div key={s.id} className="p-3 bg-slate-950/80 rounded-xl border border-slate-900 flex flex-col gap-2 text-xs">
                      <div className="flex justify-between items-center w-full">
                        <span className="font-semibold text-slate-200">{s.nombre}</span>
                        <div className="flex gap-2.5">
                          <button onClick={() => { setIdServicioEditando(s.id); setPrecioEditando(s.precio); }} className="text-amber-400 hover:text-amber-300 font-bold">Editar</button>
                          <button onClick={() => handleEliminarServicio(s.id)} className="text-rose-400 hover:text-rose-300 font-bold">Quitar</button>
                        </div>
                      </div>
                      {idServicioEditando === s.id ? (
                        <div className="flex gap-1.5 mt-1">
                          <input type="number" placeholder="Precio" value={precioEditando} onChange={e => setPrecioEditando(e.target.value)} className="bg-slate-900 border border-slate-700 p-2 rounded-xl w-full text-xs text-white focus:outline-none focus:border-amber-500" />
                          <button onClick={() => handleActualizarPrecio(s.id)} className="bg-emerald-500 text-black px-3 rounded-xl font-bold text-xs">✔</button>
                          <button onClick={() => setIdServicioEditando(null)} className="bg-slate-800 text-slate-300 px-3 rounded-xl font-bold text-xs">✖</button>
                        </div>
                      ) : (
                        <span className="font-bold text-amber-500/90">${s.precio.toLocaleString('es-CL')}</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TABLERO CENTRAL DE CITAS (Cambia dinámicamente según quién se conecte) */}
          <div className={`${perfil.es_admin ? 'lg:col-span-2' : 'lg:col-span-3'} bg-slate-900/40 border border-slate-900 p-5 sm:p-6 rounded-3xl shadow-xl space-y-4`}>
            <div className="flex justify-between items-center pb-2 border-b border-slate-800/60">
              <h2 className="text-xs font-black uppercase tracking-widest text-amber-500 flex items-center gap-2">
                <span>📅</span> {perfil.es_admin ? 'Bitácora Completa de Turnos' : 'Tu Agenda de Clientes'}
              </h2>
              <span className="bg-slate-950 border border-slate-800 text-slate-400 px-3 py-1 rounded-full text-[10px] font-black tracking-wider uppercase">
                {citas.length} registrados
              </span>
            </div>
            
            {citas.length === 0 ? (
              <p className="text-sm text-slate-500 py-6 text-center">No hay reservas registradas en el sistema todavía.</p>
            ) : (
              <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1 custom-scrollbar">
                {citas.map((c) => (
                  <div key={c.id} className="p-4 rounded-2xl bg-slate-950/70 border border-slate-900 hover:border-slate-800/80 transition-all flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
                    
                    {/* Información del Cliente */}
                    <div className="space-y-1 w-full sm:w-auto">
                      <p className="font-bold text-sm text-white tracking-wide">{c.nombre_cliente}</p>
                      
                      <div className="flex flex-wrap gap-x-3 gap-y-1 items-center text-xs text-slate-400">
                        <span className="text-slate-300 font-medium">{c.servicios?.nombre}</span>
                        <span className="text-slate-600">•</span>
                        <span className="text-amber-500 font-bold">${c.servicios?.precio?.toLocaleString('es-CL')}</span>
                      </div>
                      
                      {c.telefono_cliente && (
                        <p className="text-xs text-slate-500 flex items-center gap-1 pt-0.5">
                          <span>📞</span> <span className="font-medium text-slate-300 select-all">{c.telefono_cliente}</span>
                        </p>
                      )}
                      
                      {perfil.es_admin && (
                        <p className="text-[10px] font-black tracking-widest uppercase text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-md w-fit mt-1">
                          💈 Atiende: {c.nombre_barbero}
                        </p>
                      )}
                    </div>
                    
                    {/* Fecha y Hora en Formato Pill Premium */}
                    <div className="flex sm:flex-row gap-2 w-full sm:w-auto justify-end pt-2 sm:pt-0">
                      <span className="text-[11px] font-extrabold tracking-wider bg-slate-900 border border-slate-800 text-slate-300 px-3 py-2 rounded-xl text-center flex-1 sm:flex-initial">
                        {formatearFecha(c.fecha)}
                      </span>
                      <span className="text-[11px] font-black tracking-wider bg-amber-500 text-black px-4 py-2 rounded-xl text-center flex-1 sm:flex-initial shadow-md shadow-amber-500/5">
                        {c.hora.substring(0,5)}
                      </span>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  )
}