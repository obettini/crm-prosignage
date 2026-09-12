import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type User = {
  id: string
  email: string
  nombre: string
  rol: 'gerencia' | 'comercial' | 'operaciones' | 'gerente_servicios' | 'servicio_tecnico' | 'admin'
  activo: boolean
}

export type Empresa = {
  id: string
  nombre: string
  email?: string
  telefono?: string
  direccion?: string
  created_at: string
  updated_at: string
}

export type Contacto = {
  id: string
  nombre: string
  email?: string
  telefono?: string
  empresa_id: string
  created_at: string
  updated_at: string
}

export type Deal = {
  id: string
  nombre: string
  empresa_id: string
  monto?: number
  fecha_cierre?: string
  etapa: 'Detección Oportunidad' | 'Relevamiento' | 'Propuesta' | 'Negociación' | 'Acuerdo' | 'Ganado' | 'Perdido'
  propietario?: string
  created_at: string
  updated_at: string
}

export type ServicioInstalacion = {
  id: string
  nombre: string
  deal_id: string
  etapa: 'A Coordinar' | 'Relevamiento' | 'Compras y Logistica' | 'Coordinación del servicio' | 'Instalación' | 'Cerrado'
  detalle_servicio?: string
  fecha_instalacion?: string
  propietario?: string
  created_at: string
  updated_at: string
}

export type AsistenciaTecnica = {
  id: string
  referencia: string
  empresa_id: string
  etapa: 'En Registro' | 'En Diagnostico' | 'Esperando Aprobación' | 'En reparación' | 'Coordinación de entrega' | 'Cerrado'
  descripcion?: string
  propietario?: string
  created_at: string
  updated_at: string
}

export type Tarea = {
  id: string
  nombre: 'Entrega Documentación SSHH' | 'Compra de Materiales' | 'Verificación de requisitos' | 'Orden de Servicio' | 'Facturación'
  asignado_a: string
  estado: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED'
  servicio_instalacion_id?: string
  detalle_tarea?: string
  created_at: string
  updated_at: string
}

export type Archivo = {
  id: string
  nombre: string
  url: string
  tipo_registro: 'empresa' | 'contacto' | 'deal' | 'servicio_instalacion' | 'asistencia_tecnica' | 'tarea'
  registro_id: string
  created_at: string
}
