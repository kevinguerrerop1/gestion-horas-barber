// app/page.js
'use client'
import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'

const HORAS_LABORALES = ['09:00', '10:00', '11:00', '12:00', '14:00', '15:00', '16:00', '17:00']

export default function Home() {
  const [barberos, setBarberos] = useState<any[]>([])
  const [servicios, setServicios] = useState([])
  
  const [barberoSel, setBarberoSel] = useState('')
  const [servicioSel, setServicioSel] = useState(null)
  const [fecha, setFecha] = useState('')
  const [horasDisponibles, setHorasDisponibles] = useState([])
  const [horaSel, setHoraSel] = useState('')
  const [nombre, setNombre] = useState('')
  const [correo, setCorreo] = useState('')
  const [telefono, setTelefono] = useState('') // 👈 Nuevo estado para el teléfono
  const [mensaje, setMensaje] = useState('')

  useEffect(() => {
    async function cargarInicial() {
      const { data: listaBarberos, error } = await supabase
        .from('profiles')
        .select('id, nombre')
        .eq('es_admin', false)
      
      if (!error && listaBarberos) {
        setBarberos(listaBarberos)
      }
      
      const { data: servs } = await supabase.from('servicios').select('*')
      setServicios(servs || [])
    }
    cargarInicial()
  }, [])

  useEffect(() => {
    if (!fecha || !barberoSel) return

    async function cargarDisponibilidad() {
      const { data: citas } = await supabase.from('citas').select('hora').eq('fecha', fecha).eq('barbero_id', barberoSel)
      const { data: bloqueos } = await supabase.from('bloqueos').select('hora_inicio, hora_fin').eq('fecha', fecha).eq('barbero_id', barberoSel)

      const horasOcupadas = citas?.map(c => c.hora.substring(0, 5)) || []
      const libres = HORAS_LABORALES.filter(hora => {
        if (horasOcupadas.includes(hora)) return false
        return !bloqueos?.some(b => !b.hora_inicio || (hora >= b.hora_inicio && hora <= b.hora_fin))
      })
      setHorasDisponibles(libres)
    }
    cargarDisponibilidad()
  }, [fecha, barberoSel])

  const handleReservar = async (e) => {
    e.preventDefault()
    setMensaje('')

    if (!servicioSel) {
      alert('Por favor, selecciona un servicio antes de continuar.')
      return
    }

    // Insertar incluyendo el nuevo campo telefono_cliente
    const { error } = await supabase.from('citas').insert([
      { 
        nombre_cliente: nombre, 
        correo_cliente: correo, 
        telefono_cliente: telefono, // 👈 Enviamos el teléfono a Supabase
        fecha, 
        hora: horaSel, 
        barbero_id: barberoSel, 
        servicio_id: servicioSel.id 
      }
    ])

    if (error) {
      setMensaje('Error al agendar: ' + error.message)
    } else {
      setMensaje('¡Cita agendada con éxito!')
      setNombre('')
      setCorreo('')
      setTelefono('') // 👈 Limpiamos el campo
      setFecha('')
      setBarberoSel('')
      setServicioSel(null)
      setHoraSel('')
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center selection:bg-amber-500 selection:text-black">
      <div className="max-w-xl w-full bg-slate-900/60 backdrop-blur-md rounded-3xl p-6 sm:p-10 border border-slate-800/80 shadow-2xl space-y-8">
        
        <div className="text-center space-y-2">
          <div className="inline-flex p-3 bg-amber-500/10 rounded-full border border-amber-500/20 text-amber-500 mb-2">
            <span className="text-2xl">💈</span>
          </div>
          <h1 className="text-3xl font-black tracking-tight text-white uppercase sm:text-4xl">
            Reserva tu <span className="text-amber-500">Experiencia</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-sm mx-auto">
            Selecciona el profesional y los servicios para lucir tu mejor versión.
          </p>
        </div>

        <form onSubmit={handleReservar} className="space-y-6">
          
          {/* 1. Barbero */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-widest text-amber-500">1. Selecciona Especialista</label>
            <select 
              required 
              value={barberoSel} 
              onChange={e => setBarberoSel(e.target.value)} 
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all cursor-pointer"
            >
              <option value="" className="bg-slate-950 text-slate-400">Elige un barbero...</option>
              {barberos.map(b => <option key={b.id} value={b.id} className="bg-slate-950 text-slate-200">{b.nombre}</option>)}
            </select>
          </div>

          {/* 2. Servicio */}
          <div className="space-y-3">
            <label className="block text-xs font-bold uppercase tracking-widest text-amber-500">2. Menú de Servicios</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {servicios.map(s => (
                <div 
                  key={s.id} 
                  onClick={() => setServicioSel(s)}
                  className={`p-4 border rounded-2xl flex flex-col justify-between gap-2 cursor-pointer transition-all duration-200 ${
                    servicioSel?.id === s.id 
                      ? 'border-amber-500 bg-amber-500/10 text-white shadow-[0_0_15px_rgba(245,158,11,0.15)]' 
                      : 'border-slate-800 bg-slate-950/40 text-slate-300 hover:border-slate-700 hover:bg-slate-950/80'
                  }`}
                >
                  <span className="font-semibold text-sm tracking-wide">{s.nombre}</span>
                  <span className={`text-base font-black ${servicioSel?.id === s.id ? 'text-amber-400' : 'text-slate-400'}`}>
                    ${s.precio.toLocaleString('es-CL')}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* 3. Fecha */}
          {barberoSel && servicioSel && (
            <div className="space-y-2 animate-fadeIn">
              <label className="block text-xs font-bold uppercase tracking-widest text-amber-500">3. Elige el Día</label>
              <input 
                type="date" 
                required 
                min={new Date().toISOString().split('T')[0]} 
                value={fecha} 
                onChange={e => setFecha(e.target.value)} 
                className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-200 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all color-scheme-dark" 
              />
            </div>
          )}

          {/* 4. Horas */}
          {fecha && (
            <div className="space-y-3 animate-fadeIn">
              <label className="block text-xs font-bold uppercase tracking-widest text-amber-500">4. Horas Disponibles</label>
              {horasDisponibles.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {horasDisponibles.map(h => (
                    <button 
                      key={h} 
                      type="button" 
                      onClick={() => setHoraSel(h)} 
                      className={`p-3 text-xs font-bold rounded-xl border tracking-wider transition-all duration-150 ${
                        horaSel === h 
                          ? 'bg-amber-500 text-black border-amber-500 font-extrabold shadow-lg shadow-amber-500/20' 
                          : 'bg-slate-950/60 border-slate-800 text-slate-300 hover:border-slate-600'
                      }`}
                    >
                      {h}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-rose-400 font-semibold bg-rose-500/10 p-3 rounded-xl border border-rose-500/20 text-center">
                  🚫 No quedan cupos disponibles para esta fecha.
                </p>
              )}
            </div>
          )}

          {/* 5. Datos de Contacto */}
          {horaSel && (
            <div className="space-y-4 pt-6 border-t border-slate-800/80 animate-fadeIn">
              <label className="block text-xs font-bold uppercase tracking-widest text-amber-500">5. Información de Contacto</label>
              <div className="space-y-3">
                <input type="text" placeholder="Tu Nombre Completo" required value={nombre} onChange={e => setNombre(e.target.value)} className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500" />
                <input type="email" placeholder="Correo Electrónico" required value={correo} onChange={e => setCorreo(e.target.value)} className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500" />
                
                {/* Nuevo input para el Teléfono */}
                <input 
                  type="tel" 
                  placeholder="Teléfono de Contacto (Ej: +56912345678)" 
                  required 
                  value={telefono} 
                  onChange={e => setTelefono(e.target.value)} 
                  className="w-full bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-amber-500" 
                />
              </div>
              
              <button type="submit" className="w-full bg-amber-500 text-black p-4 rounded-xl font-black text-sm tracking-widest uppercase hover:bg-amber-400 transition-colors shadow-xl shadow-amber-500/10 mt-2">
                Confirmar Cita VIP
              </button>
            </div>
          )}
        </form>

        {mensaje && (
          <div className={`p-4 rounded-xl text-sm font-semibold text-center border ${
            mensaje.includes('Error') 
              ? 'bg-rose-500/10 border-rose-500/20 text-rose-400' 
              : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
          }`}>
            {mensaje}
          </div>
        )}
      </div>
    </div>
  )
}