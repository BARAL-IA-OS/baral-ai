import { useState } from 'react'
import { Sparkles, Trash2, Megaphone } from 'lucide-react'
import { SocialPreview } from '../components/preview/SocialPreview'
import type { MockContent } from '../components/preview/ChannelMocks'

interface Campaign {
  id: string
  name: string
  prompt: string
  content: MockContent
}

// Datos de marca de ejemplo. El backend usará el Brand Brain real del usuario.
const BRAND = { brandName: 'Studio Foto', handle: 'studiofoto', initials: 'SF' }

// Placeholder de "generación": hoy arma el contenido a partir del prompt en el
// frontend. Cuando el backend esté listo, esto vendrá del pipeline de IA
// (texto + imagen/infografía generada).
function buildContent(prompt: string): MockContent {
  const clean = prompt.trim()
  return {
    ...BRAND,
    recipient: 'María García',
    subject: clean.slice(0, 60) || 'Tu nueva campaña',
    caption: clean || 'Describe tu campaña para generar el contenido.',
    hashtags: ['#Campaña', '#StudioFoto', '#Medellín'],
    cta: 'Más información',
    mediaAlt: 'Imagen generada a partir de tu descripción',
  }
}

function nameFromPrompt(prompt: string, index: number): string {
  const words = prompt.trim().split(/\s+/).slice(0, 4).join(' ')
  return words || `Campaña ${index}`
}

const SEED: Campaign = {
  id: 'seed',
  name: 'Sesiones de primavera',
  prompt: 'Promociona las nuevas sesiones de fotos familiares de primavera, luz natural y entrega en 48h.',
  content: buildContent(
    'Ya está abierta la agenda de sesiones de primavera. Luz natural, exteriores y entrega en 48h para recuerdos que duran.',
  ),
}

export function Studio() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([SEED])
  const [selectedId, setSelectedId] = useState<string>(SEED.id)
  const [prompt, setPrompt] = useState('')

  const selected = campaigns.find((c) => c.id === selectedId) ?? null

  function handleGenerate() {
    const clean = prompt.trim()
    if (!clean) return
    const campaign: Campaign = {
      id: crypto.randomUUID(),
      name: nameFromPrompt(clean, campaigns.length + 1),
      prompt: clean,
      content: buildContent(clean),
    }
    setCampaigns((prev) => [campaign, ...prev])
    setSelectedId(campaign.id)
    setPrompt('')
  }

  function handleDelete(id: string) {
    setCampaigns((prev) => {
      const next = prev.filter((c) => c.id !== id)
      if (id === selectedId) setSelectedId(next[0]?.id ?? '')
      return next
    })
  }

  return (
    <section className="page studio-page">
      <div className="dashboard-heading">
        <h1>Estudio de contenido</h1>
        <p>Describe tu campaña, genérala y mira cómo quedaría en cada canal.</p>
      </div>

      <div className="studio-layout">
        {/* Izquierda: generación + lista de campañas */}
        <div className="studio-main">
          <div className="studio-generator">
            <label htmlFor="studio-prompt">¿Qué campaña quieres generar?</label>
            <textarea
              id="studio-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Ej. Anuncia un 2x1 en sesiones de fotos para el Día de la Madre, tono cálido y cercano."
            />
            <div className="studio-generator-footer">
              <span className="studio-generator-note">
                La IA generará texto + imagen para cada red.
              </span>
              <button
                type="button"
                className="button button-primary"
                onClick={handleGenerate}
                disabled={!prompt.trim()}
              >
                <Sparkles size={15} strokeWidth={2} />
                Generar campaña
              </button>
            </div>
          </div>

          <div className="studio-list">
            <div className="studio-list-head">
              <span>Mis campañas</span>
              <small>{campaigns.length}</small>
            </div>
            <div className="studio-list-scroll">
              {campaigns.length === 0 ? (
                <p className="studio-empty">Aún no has generado campañas. Describe una arriba ↑</p>
              ) : (
                campaigns.map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    className={`studio-card ${c.id === selectedId ? 'is-active' : ''}`}
                    onClick={() => setSelectedId(c.id)}
                  >
                    <span className="studio-card-icon">
                      <Megaphone size={16} strokeWidth={1.9} />
                    </span>
                    <span className="studio-card-copy">
                      <strong>{c.name}</strong>
                      <small>{c.prompt}</small>
                    </span>
                    <span
                      className="studio-card-delete"
                      role="button"
                      tabIndex={0}
                      aria-label="Eliminar campaña"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleDelete(c.id)
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.stopPropagation()
                          handleDelete(c.id)
                        }
                      }}
                    >
                      <Trash2 size={15} />
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Derecha: vista previa fija */}
        <aside className="studio-preview">
          {selected ? (
            <SocialPreview content={selected.content} />
          ) : (
            <div className="studio-preview-empty">
              <Sparkles size={28} strokeWidth={1.3} />
              <strong>Sin campaña seleccionada</strong>
              <p>Genera o elige una campaña para ver el preview.</p>
            </div>
          )}
        </aside>
      </div>
    </section>
  )
}
