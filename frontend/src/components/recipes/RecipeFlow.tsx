import { ArrowLeft, Database, Eye, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import type { RecipeType } from '../../types'
import { RecipeParams } from './RecipeParams'

interface RecipeFlowProps {
  type: RecipeType
}

const recipeCopy: Record<RecipeType, { title: string; description: string; action: string }> = {
  reactivacion: {
    title: 'Reactivar clientes',
    description: 'Encuentra clientes inactivos y prepara mensajes personalizados para recuperarlos.',
    action: 'Detectar clientes sin compra reciente',
  },
  bienvenida: {
    title: 'Bienvenida',
    description: 'Prepara el primer contacto para nuevos clientes con el tono de tu marca.',
    action: 'Crear un primer mensaje calido',
  },
  postventa: {
    title: 'Post-venta',
    description: 'Crea seguimiento inteligente despues de una compra para fidelizar.',
    action: 'Dar seguimiento despues de una compra',
  },
  lanzamiento: {
    title: 'Lanzamiento',
    description: 'Genera copy multicanal para anunciar un producto, servicio o campana.',
    action: 'Anunciar una novedad',
  },
  propuesta: {
    title: 'Propuesta express',
    description: 'Construye una propuesta comercial breve, clara y lista para revisar.',
    action: 'Armar una propuesta comercial',
  },
}

export function RecipeFlow({ type }: RecipeFlowProps) {
  const copy = recipeCopy[type]

  return (
    <section className="recipe-page">
      {/* Compact inline header */}
      <div className="recipe-topbar">
        <Link to="/dashboard" className="recipe-back">
          <ArrowLeft size={16} />
          Dashboard
        </Link>
        <div className="recipe-topbar-center">
          <span className="recipe-topbar-badge">Receta</span>
          <h1>{copy.title}</h1>
          <p>{copy.description}</p>
        </div>
      </div>

      <div className="recipe-guide">
        <div className="recipe-guide-item is-active">
          <span>1</span>
          <strong>Configura</strong>
          <small>{copy.action}</small>
        </div>
        <div className="recipe-guide-item">
          <Sparkles size={16} />
          <strong>Genera</strong>
          <small>Baral AI crea el borrador.</small>
        </div>
        <div className="recipe-guide-item">
          <Eye size={16} />
          <strong>Revisa y envia</strong>
          <small>Edita antes de aprobar.</small>
        </div>
      </div>

      <div className="recipe-layout recipe-layout-simple">
        <RecipeParams type={type} />

        <aside className="recipe-side-panel recipe-help-panel">
          <div className="panel-heading">
            <span className="panel-icon"><Database size={16} /></span>
            <div>
              <span>Contexto</span>
              <h2>Que usara Baral AI</h2>
            </div>
          </div>

          <div className="recipe-side-step">
            <Database size={16} />
            <span>
              <strong>Tu base de clientes</strong>
              <small>Filtra los destinatarios que cumplen la condicion.</small>
            </span>
          </div>
          <div className="recipe-side-step">
            <Sparkles size={16} />
            <span>
              <strong>Tu Brand Brain</strong>
              <small>Mantiene tono, propuesta y limites de la marca.</small>
            </span>
          </div>
        </aside>
      </div>
    </section>
  )
}
