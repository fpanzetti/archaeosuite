'use client'
import { useEffect, useRef } from 'react'
import { useTema } from '@/lib/theme/ThemeContext'

interface Colonna {
  key: string
  post: string | null
  ant: string | null
  cont: string | null
}

interface Props {
  rapporti: Record<string, number[]>
  colonne: Colonna[]
}

export default function LineeRapporti({ rapporti, colonne }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const { p, tema } = useTema()

  function disegna(colorePost: string, coloreCont: string, coloreAnt: string) {
    const svg = svgRef.current
    if (!svg) return
    const container = svg.parentElement
    if (!container) return

    const w = container.offsetWidth
    const h = container.offsetHeight
    if (w === 0 || h === 0) return

    svg.innerHTML = ''
    svg.setAttribute('width', String(w))
    svg.setAttribute('height', String(h))
    svg.setAttribute('viewBox', `0 0 ${w} ${h}`)

    const usEl = document.getElementById('us-corrente-center')
    if (!usEl) return

    const containerRect = container.getBoundingClientRect()
    const usRect = usEl.getBoundingClientRect()
    const usX = usRect.left - containerRect.left + usRect.width / 2
    const usY = usRect.top - containerRect.top + usRect.height / 2

    const categorie = [
      { chiavi: colonne.filter(c => c.post).map(c => c.post!), colore: colorePost },
      { chiavi: colonne.filter(c => c.cont).map(c => c.cont!), colore: coloreCont },
      { chiavi: colonne.filter(c => c.ant).map(c => c.ant!), colore: coloreAnt },
    ]

    categorie.forEach(({ chiavi, colore }) => {
      const attive = chiavi.filter(k => (rapporti[k] ?? []).length > 0)
      if (attive.length === 0) return

      // Punto medio tra tutte le celle attive della categoria
      let sumX = 0, sumY = 0, count = 0
      attive.forEach(k => {
        const el = document.getElementById(`cella-${k}`)
        if (!el) return
        const r = el.getBoundingClientRect()
        sumX += r.left - containerRect.left + r.width / 2
        sumY += r.top - containerRect.top + r.height / 2
        count++
      })
      if (count === 0) return

      const targetX = sumX / count
      const targetY = sumY / count

      // Linea tratteggiata
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      line.setAttribute('x1', String(usX))
      line.setAttribute('y1', String(usY))
      line.setAttribute('x2', String(targetX))
      line.setAttribute('y2', String(targetY))
      line.setAttribute('stroke', colore)
      line.setAttribute('stroke-width', '1.5')
      line.setAttribute('stroke-dasharray', '5 3')
      line.setAttribute('opacity', '0.7')
      svg.appendChild(line)

      // Punto finale
      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      dot.setAttribute('cx', String(targetX))
      dot.setAttribute('cy', String(targetY))
      dot.setAttribute('r', '4')
      dot.setAttribute('fill', colore)
      dot.setAttribute('opacity', '0.8')
      svg.appendChild(dot)

      // Punto origine
      const dotStart = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      dotStart.setAttribute('cx', String(usX))
      dotStart.setAttribute('cy', String(usY))
      dotStart.setAttribute('r', '3')
      dotStart.setAttribute('fill', colore)
      dotStart.setAttribute('opacity', '0.5')
      svg.appendChild(dotStart)
    })
  }

  useEffect(() => {
    const colorePost = p.accentBlue
    const coloreCont = p.accentGreen
    const coloreAnt = p.accentAmber

    // Primo disegno dopo mount — piccolo delay per DOM pronto
    const t = setTimeout(() => disegna(colorePost, coloreCont, coloreAnt), 100)

    // Ridisegna al resize del contenitore
    const container = svgRef.current?.parentElement
    if (!container) return () => clearTimeout(t)

    const observer = new ResizeObserver(() => disegna(colorePost, coloreCont, coloreAnt))
    observer.observe(container)

    return () => {
      clearTimeout(t)
      observer.disconnect()
    }
  }, [rapporti, colonne, tema])

  return (
    <svg ref={svgRef}
      style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:10 }}
    />
  )
}
