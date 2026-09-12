'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Deal, ServicioInstalacion, AsistenciaTecnica, Empresa, Contacto, Tarea } from '@/lib/supabase'

// Componente principal del CRM
export default function CRM() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')
  
  // Datos
  const [deals, setDeals] = useState<Deal[]>([])
  const [servicios, setServicios] = useState<ServicioInstalacion[]>([])
  const [asistencia, setAsistencia] = useState<AsistenciaTecnica[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [tareas, setTareas] = useState<Tarea[]>([])

  // Estado del modal
  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('')

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        // Obtener datos del usuario
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()
        
        setCurrentUser(userData)
        loadData()
      } else {
        // Redirigir a login
        window.location.href = '/login'
      }
    } catch (error) {
      console.error('Error:', error)
    } finally {
      setLoading(false)
    }
  }

  async function loadData() {
    try {
      // Cargar deals
      const { data: dealsData } = await supabase.from('deals').select('*')
      setDeals(dealsData || [])

      // Cargar servicios
      const { data: serviciosData } = await supabase.from('servicios_instalacion').select('*')
      setServicios(serviciosData || [])

      // Cargar asistencia
      const { data: asistenciaData } = await supabase.from('asistencia_tecnica').select('*')
      setAsistencia(asistenciaData || [])

      // Cargar empresas
      const { data: empresasData } = await supabase.from('empresas').select('*')
      setEmpresas(empresasData || [])

      // Cargar tareas
      const { data: tareasData } = await supabase.from('tareas').select('*')
      setTareas(tareasData || [])
    } catch (error) {
      console.error('Error cargando datos:', error)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>

  if (!currentUser) return <div>No autenticado</div>

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800">Pro Signage</h1>
          <p className="text-sm text-gray-600 mt-1">CRM</p>
        </div>

        <nav className="space-y-2 px-4 py-8">
          <NavItem
            label="Dashboard"
            onClick={() => setActiveTab('dashboard')}
            active={activeTab === 'dashboard'}
          />
          <NavItem
            label="Negocios"
            onClick={() => setActiveTab('negocios')}
            active={activeTab === 'negocios'}
          />
          <NavItem
            label="Servicios"
            onClick={() => setActiveTab('servicios')}
            active={activeTab === 'servicios'}
          />
          <NavItem
            label="Soporte Técnico"
            onClick={() => setActiveTab('soporte')}
            active={activeTab === 'soporte'}
          />
          <NavItem
            label="Tareas"
            onClick={() => setActiveTab('tareas')}
            active={activeTab === 'tareas'}
          />
        </nav>

        <div className="absolute bottom-0 w-64 p-6 border-t">
          <p className="text-sm text-gray-700 font-medium">{currentUser?.nombre}</p>
          <p className="text-xs text-gray-500">{currentUser?.email}</p>
          <button
            onClick={async () => {
              await supabase.auth.signOut()
              window.location.href = '/login'
            }}
            className="mt-4 w-full bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded text-sm"
          >
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white shadow">
          <div className="px-8 py-6">
            <h2 className="text-3xl font-bold text-gray-800">
              {getTabTitle(activeTab)}
            </h2>
          </div>
        </header>

        <div className="p-8">
          {activeTab === 'dashboard' && (
            <Dashboard deals={deals} servicios={servicios} asistencia={asistencia} />
          )}
          
          {activeTab === 'negocios' && (
            <Pipeline
              title="Pipeline de Negocios"
              items={deals}
              stages={[
                'Detección Oportunidad',
                'Relevamiento',
                'Propuesta',
                'Negociación',
                'Acuerdo',
                'Ganado',
                'Perdido'
              ]}
              onAdd={() => {
                setModalType('deal')
                setShowModal(true)
              }}
              userRole={currentUser?.rol}
            />
          )}

          {activeTab === 'servicios' && (
            <Pipeline
              title="Servicios de Instalación"
              items={servicios}
              stages={[
                'A Coordinar',
                'Relevamiento',
                'Compras y Logistica',
                'Coordinación del servicio',
                'Instalación',
                'Cerrado'
              ]}
              onAdd={() => {
                setModalType('servicio')
                setShowModal(true)
              }}
              userRole={currentUser?.rol}
            />
          )}

          {activeTab === 'soporte' && (
            <Pipeline
              title="Asistencia Técnica"
              items={asistencia}
              stages={[
                'En Registro',
                'En Diagnostico',
                'Esperando Aprobación',
                'En reparación',
                'Coordinación de entrega',
                'Cerrado'
              ]}
              onAdd={() => {
                setModalType('asistencia')
                setShowModal(true)
              }}
              userRole={currentUser?.rol}
            />
          )}

          {activeTab === 'tareas' && (
            <TaskList
              tareas={tareas}
              userRole={currentUser?.rol}
              userId={currentUser?.id || ''}
            />
          )}
        </div>
      </main>
    </div>
  )
}

function NavItem({ label, onClick, active }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2 rounded-lg transition ${
        active
          ? 'bg-blue-500 text-white'
          : 'text-gray-700 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  )
}

function Dashboard({ deals, servicios, asistencia }: any) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
      <Card title="Deals Activos" value={deals.length} color="blue" />
      <Card title="Servicios" value={servicios.length} color="green" />
      <Card title="Soporte Técnico" value={asistencia.length} color="orange" />
      <Card title="Ingresos" value="$0" color="purple" />
    </div>
  )
}

function Card({ title, value, color }: any) {
  const colorClasses = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500'
  }
  
  return (
    <div className={`${colorClasses[color]} text-white rounded-lg shadow p-6`}>
      <p className="text-gray-100 text-sm">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  )
}

function Pipeline({ title, items, stages, onAdd, userRole }: any) {
  const canCreate = ['gerencia', 'comercial', 'gerente_servicios'].includes(userRole)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">{title}</h3>
        {canCreate && (
          <button
            onClick={onAdd}
            className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded"
          >
            + Agregar
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stages.map((stage: string) => (
          <div key={stage} className="bg-white rounded-lg p-4 shadow">
            <h4 className="font-semibold text-gray-800 mb-4 text-sm">{stage}</h4>
            <div className="space-y-2">
              {items
                .filter((item: any) => item.etapa === stage)
                .map((item: any) => (
                  <div
                    key={item.id}
                    className="bg-gray-50 border-l-4 border-blue-500 p-3 rounded cursor-pointer hover:bg-gray-100"
                  >
                    <p className="font-medium text-sm text-gray-800">{item.nombre}</p>
                    {item.monto && (
                      <p className="text-xs text-gray-600 mt-1">${item.monto}</p>
                    )}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function TaskList({ tareas, userRole, userId }: any) {
  const canCreate = ['gerencia', 'gerente_servicios'].includes(userRole)
  
  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Tareas</h3>
        {canCreate && (
          <button className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
            + Nueva Tarea
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Tarea</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Asignado</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Estado</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {tareas.map((tarea: Tarea) => (
              <tr key={tarea.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">{tarea.nombre}</td>
                <td className="px-6 py-4 text-sm">{tarea.asignado_a}</td>
                <td className="px-6 py-4 text-sm">
                  <span className={`px-3 py-1 rounded text-xs font-semibold ${
                    tarea.estado === 'COMPLETED'
                      ? 'bg-green-100 text-green-800'
                      : tarea.estado === 'IN_PROGRESS'
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {tarea.estado}
                  </span>
                </td>
                <td className="px-6 py-4 text-sm">
                  <button className="text-blue-500 hover:text-blue-700">Ver</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function getTabTitle(tab: string) {
  const titles: { [key: string]: string } = {
    dashboard: 'Dashboard',
    negocios: 'Pipeline de Negocios',
    servicios: 'Servicios de Instalación',
    soporte: 'Asistencia Técnica',
    tareas: 'Tareas'
  }
  return titles[tab] || 'CRM'
}
