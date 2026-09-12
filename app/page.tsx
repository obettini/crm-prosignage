'use client'

import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Deal, ServicioInstalacion, AsistenciaTecnica, Empresa, Tarea } from '@/lib/supabase'

export default function CRM() {
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('dashboard')

  const [deals, setDeals] = useState<Deal[]>([])
  const [servicios, setServicios] = useState<ServicioInstalacion[]>([])
  const [asistencia, setAsistencia] = useState<AsistenciaTecnica[]>([])
  const [empresas, setEmpresas] = useState<Empresa[]>([])
  const [tareas, setTareas] = useState<Tarea[]>([])

  const [showModal, setShowModal] = useState(false)
  const [modalType, setModalType] = useState('') // 'deal' | 'servicio' | 'asistencia'
  const [editingItem, setEditingItem] = useState<any>(null) // item siendo editado, null = creando nuevo

  useEffect(() => {
    checkAuth()
  }, [])

  async function checkAuth() {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        const { data: userData } = await supabase
          .from('users')
          .select('*')
          .eq('id', user.id)
          .single()

        setCurrentUser(userData)
        loadData()
      } else {
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
      const { data: dealsData } = await supabase.from('deals').select('*').order('created_at', { ascending: false })
      setDeals(dealsData || [])

      const { data: serviciosData } = await supabase.from('servicios_instalacion').select('*').order('created_at', { ascending: false })
      setServicios(serviciosData || [])

      const { data: asistenciaData } = await supabase.from('asistencia_tecnica').select('*').order('created_at', { ascending: false })
      setAsistencia(asistenciaData || [])

      const { data: empresasData } = await supabase.from('empresas').select('*').order('nombre', { ascending: true })
      setEmpresas(empresasData || [])

      const { data: tareasData } = await supabase.from('tareas').select('*')
      setTareas(tareasData || [])
    } catch (error) {
      console.error('Error cargando datos:', error)
    }
  }

  function openCreateModal(type: string) {
    setModalType(type)
    setEditingItem(null)
    setShowModal(true)
  }

  function openEditModal(type: string, item: any) {
    setModalType(type)
    setEditingItem(item)
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
    setEditingItem(null)
    setModalType('')
  }

  async function handleSave(formData: any) {
    try {
      const table =
        modalType === 'deal' ? 'deals' :
        modalType === 'servicio' ? 'servicios_instalacion' :
        'asistencia_tecnica'

      if (editingItem) {
        const { error } = await supabase.from(table).update(formData).eq('id', editingItem.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from(table).insert(formData)
        if (error) throw error
      }

      await loadData()
      closeModal()
    } catch (error: any) {
      alert('Error al guardar: ' + error.message)
    }
  }

  async function handleDelete() {
    if (!editingItem) return
    if (!confirm('¿Seguro que querés eliminar este registro?')) return

    try {
      const table =
        modalType === 'deal' ? 'deals' :
        modalType === 'servicio' ? 'servicios_instalacion' :
        'asistencia_tecnica'

      const { error } = await supabase.from(table).delete().eq('id', editingItem.id)
      if (error) throw error

      await loadData()
      closeModal()
    } catch (error: any) {
      alert('Error al eliminar: ' + error.message)
    }
  }

  if (loading) return <div className="flex items-center justify-center h-screen">Cargando...</div>
  if (!currentUser) return <div>No autenticado</div>

  return (
    <div className="flex h-screen bg-gray-100">
      <aside className="w-64 bg-white shadow-lg flex flex-col">
        <div className="p-6">
          <h1 className="text-2xl font-bold text-gray-800">Pro Signage</h1>
          <p className="text-sm text-gray-600 mt-1">CRM</p>
        </div>

        <nav className="space-y-2 px-4 py-4 flex-1">
          <NavItem label="Dashboard" onClick={() => setActiveTab('dashboard')} active={activeTab === 'dashboard'} />
          <NavItem label="Negocios" onClick={() => setActiveTab('negocios')} active={activeTab === 'negocios'} />
          <NavItem label="Servicios" onClick={() => setActiveTab('servicios')} active={activeTab === 'servicios'} />
          <NavItem label="Soporte Técnico" onClick={() => setActiveTab('soporte')} active={activeTab === 'soporte'} />
          <NavItem label="Tareas" onClick={() => setActiveTab('tareas')} active={activeTab === 'tareas'} />
          <NavItem label="Empresas" onClick={() => setActiveTab('empresas')} active={activeTab === 'empresas'} />
        </nav>

        <div className="p-6 border-t">
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

      <main className="flex-1 overflow-auto">
        <header className="bg-white shadow">
          <div className="px-8 py-6">
            <h2 className="text-3xl font-bold text-gray-800">{getTabTitle(activeTab)}</h2>
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
              empresas={empresas}
              stages={['Detección Oportunidad', 'Relevamiento', 'Propuesta', 'Negociación', 'Acuerdo', 'Ganado', 'Perdido']}
              onAdd={() => openCreateModal('deal')}
              onItemClick={(item: any) => openEditModal('deal', item)}
              userRole={currentUser?.rol}
            />
          )}

          {activeTab === 'servicios' && (
            <Pipeline
              title="Servicios de Instalación"
              items={servicios}
              empresas={empresas}
              stages={['A Coordinar', 'Relevamiento', 'Compras y Logistica', 'Coordinación del servicio', 'Instalación', 'Cerrado']}
              onAdd={() => openCreateModal('servicio')}
              onItemClick={(item: any) => openEditModal('servicio', item)}
              userRole={currentUser?.rol}
            />
          )}

          {activeTab === 'soporte' && (
            <Pipeline
              title="Asistencia Técnica"
              items={asistencia}
              empresas={empresas}
              stages={['En Registro', 'En Diagnostico', 'Esperando Aprobación', 'En reparación', 'Coordinación de entrega', 'Cerrado']}
              onAdd={() => openCreateModal('asistencia')}
              onItemClick={(item: any) => openEditModal('asistencia', item)}
              userRole={currentUser?.rol}
            />
          )}

          {activeTab === 'tareas' && (
            <TaskList tareas={tareas} userRole={currentUser?.rol} userId={currentUser?.id || ''} />
          )}

          {activeTab === 'empresas' && (
            <EmpresasList empresas={empresas} />
          )}
        </div>
      </main>

      {showModal && (
        <ItemModal
          type={modalType}
          item={editingItem}
          empresas={empresas}
          deals={deals}
          onSave={handleSave}
          onDelete={editingItem ? handleDelete : undefined}
          onClose={closeModal}
        />
      )}
    </div>
  )
}

function NavItem({ label, onClick, active }: any) {
  return (
    <button
      onClick={onClick}
      className={`w-full text-left px-4 py-2 rounded-lg transition ${
        active ? 'bg-blue-500 text-white' : 'text-gray-700 hover:bg-gray-100'
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
  const colorClasses: any = {
    blue: 'bg-blue-500',
    green: 'bg-green-500',
    orange: 'bg-orange-500',
    purple: 'bg-purple-500',
  }

  return (
    <div className={`${colorClasses[color]} text-white rounded-lg shadow p-6`}>
      <p className="text-gray-100 text-sm">{title}</p>
      <p className="text-3xl font-bold mt-2">{value}</p>
    </div>
  )
}

function Pipeline({ title, items, stages, onAdd, onItemClick, userRole, empresas }: any) {
  const canCreate = ['gerencia', 'comercial', 'gerente_servicios'].includes(userRole)

  function empresaNombre(empresaId: string) {
    const e = empresas.find((emp: Empresa) => emp.id === empresaId)
    return e ? e.nombre : ''
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">{title}</h3>
        {canCreate && (
          <button onClick={onAdd} className="bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded">
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
                    onClick={() => onItemClick(item)}
                    className="bg-gray-50 border-l-4 border-blue-500 p-3 rounded cursor-pointer hover:bg-gray-100"
                  >
                    <p className="font-medium text-sm text-gray-800">{item.nombre || item.referencia}</p>
                    {item.empresa_id && (
                      <p className="text-xs text-gray-500 mt-1">{empresaNombre(item.empresa_id)}</p>
                    )}
                    {item.monto && <p className="text-xs text-gray-600 mt-1">${item.monto}</p>}
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function EmpresasList({ empresas }: any) {
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-100 border-b">
          <tr>
            <th className="px-6 py-3 text-left text-sm font-semibold">Nombre</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">Teléfono</th>
            <th className="px-6 py-3 text-left text-sm font-semibold">Dirección</th>
          </tr>
        </thead>
        <tbody>
          {empresas.map((e: Empresa) => (
            <tr key={e.id} className="border-b hover:bg-gray-50">
              <td className="px-6 py-4 text-sm">{e.nombre}</td>
              <td className="px-6 py-4 text-sm">{e.telefono || '-'}</td>
              <td className="px-6 py-4 text-sm">{e.direccion || '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function TaskList({ tareas, userRole, userId }: any) {
  const canCreate = ['gerencia', 'gerente_servicios'].includes(userRole)

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">Tareas</h3>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-100 border-b">
            <tr>
              <th className="px-6 py-3 text-left text-sm font-semibold">Tarea</th>
              <th className="px-6 py-3 text-left text-sm font-semibold">Estado</th>
            </tr>
          </thead>
          <tbody>
            {tareas.map((tarea: Tarea) => (
              <tr key={tarea.id} className="border-b hover:bg-gray-50">
                <td className="px-6 py-4 text-sm">{tarea.nombre}</td>
                <td className="px-6 py-4 text-sm">
                  <span
                    className={`px-3 py-1 rounded text-xs font-semibold ${
                      tarea.estado === 'COMPLETED'
                        ? 'bg-green-100 text-green-800'
                        : tarea.estado === 'IN_PROGRESS'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    {tarea.estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

// ============================================
// MODAL para crear/editar Deals, Servicios, Asistencia
// ============================================
function ItemModal({ type, item, empresas, deals, onSave, onDelete, onClose }: any) {
  const isEdit = !!item

  const stagesByType: any = {
    deal: ['Detección Oportunidad', 'Relevamiento', 'Propuesta', 'Negociación', 'Acuerdo', 'Ganado', 'Perdido'],
    servicio: ['A Coordinar', 'Relevamiento', 'Compras y Logistica', 'Coordinación del servicio', 'Instalación', 'Cerrado'],
    asistencia: ['En Registro', 'En Diagnostico', 'Esperando Aprobación', 'En reparación', 'Coordinación de entrega', 'Cerrado'],
  }

  const titleByType: any = {
    deal: isEdit ? 'Editar Negocio' : 'Nuevo Negocio',
    servicio: isEdit ? 'Editar Servicio' : 'Nuevo Servicio',
    asistencia: isEdit ? 'Editar Asistencia Técnica' : 'Nueva Asistencia Técnica',
  }

  const [form, setForm] = useState<any>(() => {
    if (item) return { ...item }
    if (type === 'deal') return { nombre: '', empresa_id: '', monto: '', etapa: 'Detección Oportunidad', fecha_cierre: '' }
    if (type === 'servicio') return { nombre: '', deal_id: '', etapa: 'A Coordinar', detalle_servicio: '', fecha_instalacion: '' }
    if (type === 'asistencia') return { referencia: '', empresa_id: '', etapa: 'En Registro', descripcion: '' }
    return {}
  })

  function update(field: string, value: any) {
    setForm((prev: any) => ({ ...prev, [field]: value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const cleaned = { ...form }
    // Limpiar campos vacíos que deben ser NULL en vez de string vacío
    Object.keys(cleaned).forEach((k) => {
      if (cleaned[k] === '') cleaned[k] = null
    })
    delete cleaned.id
    delete cleaned.created_at
    delete cleaned.updated_at
    onSave(cleaned)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xl font-bold">{titleByType[type]}</h3>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none">&times;</button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {type === 'deal' && (
              <>
                <Field label="Nombre del negocio">
                  <input
                    type="text"
                    required
                    value={form.nombre || ''}
                    onChange={(e) => update('nombre', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </Field>
                <Field label="Empresa">
                  <select
                    value={form.empresa_id || ''}
                    onChange={(e) => update('empresa_id', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Sin asignar</option>
                    {empresas.map((emp: Empresa) => (
                      <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Monto (USD)">
                  <input
                    type="number"
                    value={form.monto || ''}
                    onChange={(e) => update('monto', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </Field>
                <Field label="Fecha de cierre">
                  <input
                    type="date"
                    value={form.fecha_cierre || ''}
                    onChange={(e) => update('fecha_cierre', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </Field>
              </>
            )}

            {type === 'servicio' && (
              <>
                <Field label="Nombre / Referencia">
                  <input
                    type="text"
                    required
                    value={form.nombre || ''}
                    onChange={(e) => update('nombre', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </Field>
                <Field label="Negocio relacionado">
                  <select
                    value={form.deal_id || ''}
                    onChange={(e) => update('deal_id', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Sin asignar</option>
                    {deals.map((d: Deal) => (
                      <option key={d.id} value={d.id}>{d.nombre}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Detalle del servicio">
                  <textarea
                    value={form.detalle_servicio || ''}
                    onChange={(e) => update('detalle_servicio', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                  />
                </Field>
                <Field label="Fecha de instalación">
                  <input
                    type="date"
                    value={form.fecha_instalacion || ''}
                    onChange={(e) => update('fecha_instalacion', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </Field>
              </>
            )}

            {type === 'asistencia' && (
              <>
                <Field label="Referencia">
                  <input
                    type="text"
                    required
                    value={form.referencia || ''}
                    onChange={(e) => update('referencia', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </Field>
                <Field label="Empresa">
                  <select
                    required
                    value={form.empresa_id || ''}
                    onChange={(e) => update('empresa_id', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Seleccionar...</option>
                    {empresas.map((emp: Empresa) => (
                      <option key={emp.id} value={emp.id}>{emp.nombre}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Descripción">
                  <textarea
                    value={form.descripcion || ''}
                    onChange={(e) => update('descripcion', e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg"
                    rows={3}
                  />
                </Field>
              </>
            )}

            <Field label="Etapa">
              <select
                value={form.etapa || ''}
                onChange={(e) => update('etapa', e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              >
                {stagesByType[type].map((s: string) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </Field>

            <div className="flex gap-2 pt-4">
              <button type="submit" className="flex-1 bg-blue-500 hover:bg-blue-600 text-white py-2 rounded-lg font-medium">
                {isEdit ? 'Guardar cambios' : 'Crear'}
              </button>
              {isEdit && onDelete && (
                <button
                  type="button"
                  onClick={onDelete}
                  className="bg-red-500 hover:bg-red-600 text-white py-2 px-4 rounded-lg font-medium"
                >
                  Eliminar
                </button>
              )}
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}

function Field({ label, children }: any) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
      {children}
    </div>
  )
}

function getTabTitle(tab: string) {
  const titles: { [key: string]: string } = {
    dashboard: 'Dashboard',
    negocios: 'Pipeline de Negocios',
    servicios: 'Servicios de Instalación',
    soporte: 'Asistencia Técnica',
    tareas: 'Tareas',
    empresas: 'Empresas',
  }
  return titles[tab] || 'CRM'
}
