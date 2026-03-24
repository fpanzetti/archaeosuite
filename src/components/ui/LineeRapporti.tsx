'use client'
import { useEffect, useRef } from 'react'

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

  useEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const container = svg.parentElement
    if (!container) return

    svg.innerHTML = ''
    svg.setAttribute('width', String(container.offsetWidth))
    svg.setAttribute('height', String(container.offsetHeight))

    const usEl = document.getElementById('us-corrente-center')
    if (!usEl) return

    const containerRect = container.getBoundingClientRect()
    const usRect = usEl.getBoundingClientRect()
    const usX = usRect.left - containerRect.left + usRect.width / 2
    const usY = usRect.top - containerRect.top + usRect.height / 2

    const categorie = [
      { chiavi: colonne.filter(c => c.post).map(c => c.post!), colore: '#185FA5' },
      { chiavi: colonne.filter(c => c.cont).map(c => c.cont!), colore: '#1a6b4a' },
      { chiavi: colonne.filter(c => c.ant).map(c => c.ant!), colore: '#8a5c0a' },
    ]

    categorie.forEach(({ chiavi, colore }) => {
      const attive = chiavi.filter(k => (rapporti[k] ?? []).length > 0)
      if (attive.length === 0) return

      const cellaEl = document.getElementById(`cella-${attive[0]}`)
      if (!cellaEl) return

      const cellaRect = cellaEl.getBoundingClientRect()
      const cellaX = cellaRect.left - containerRect.left + cellaRect.width / 2
      const cellaY = cellaRect.top - containerRect.top + cellaRect.height / 2

      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line')
      line.setAttribute('x1', String(usX))
      line.setAttribute('y1', String(usY))
      line.setAttribute('x2', String(cellaX))
      line.setAttribute('y2', String(cellaY))
      line.setAttribute('stroke', colore)
      line.setAttribute('stroke-width', '1.5')
      line.setAttribute('stroke-dasharray', '4 2')
      line.setAttribute('opacity', '0.6')
      svg.appendChild(line)

      const dot = document.createElementNS('http://www.w3.org/2000/svg', 'circle')
      dot.setAttribute('cx', String(cellaX))
      dot.setAttribute('cy', String(cellaY))
      dot.setAttribute('r', '3')
      dot.setAttribute('fill', colore)
      svg.appendChild(dot)
    })
  }, [rapporti, colonne])

  return (
    <svg ref={svgRef}
      style={{ position:'absolute', top:0, left:0, width:'100%', height:'100%', pointerEvents:'none', zIndex:10 }}
    />
  )
}
