import { useMemo } from 'react'
import { categoryFromScore, scoreFromCategory } from './data.js'
import './floor-plan.css'

const colors = { Excellent: '#2785cf', Good: '#54b76a', Low: '#efc540', Bad: '#e75b58' }
const rooms = {
  1: [
    ['room', 150, 80, 233, 150, 'RK f23'], ['room', 150, 230, 233, 150, 'RK f22'], ['open', 383, 80, 234, 150, 'Koridor / Pintu Masuk'], ['toilet', 383, 230, 70, 150, 'Toilet'], ['circulation', 453, 230, 94, 150, 'Tangga'], ['toilet', 547, 230, 70, 150, 'Toilet'], ['room', 617, 80, 233, 150, 'Ruang Seminar Lt. 1'], ['room', 617, 230, 233, 150, 'RK f21'], ['circulation', 450, 380, 100, 180, 'Lorong'], ['outdoor', 150, 400, 280, 140, 'Lopo & Parkiran'], ['outdoor', 600, 400, 250, 60, 'Lopo Panjang'], ['room', 250, 600, 167, 90, 'RL2'], ['room', 417, 600, 166, 90, 'Lab Lt. 1'], ['room', 583, 600, 167, 90, 'RL1'], ['room', 250, 690, 167, 90, 'RL3'], ['circulation', 417, 690, 166, 90, 'Tangga'], ['room', 583, 690, 167, 90, 'RL4'],
    // 🔧 [BARU] Area depan Gedung Utama (di atas building outline, y 0-80 -- sebelumnya kosong).
    // Cuma "Lopo & Parkiran (Depan)" yang dikasih checkpoint sinyal (CP-28, lihat data.js);
    // "Parkiran (Depan)" digambar sebagai bagian visual area yang sama tapi TIDAK punya
    // checkpoint sendiri (sesuai keputusan: satu checkpoint saja untuk seluruh zona depan).
    ['outdoor', 150, 5, 280, 55, 'Lopo & Parkiran (Depan)'], ['outdoor', 630, 5, 220, 55, 'Parkiran (Depan)'],
  ],
  2: [
    ['room', 150, 80, 233, 150, 'R. Kepro'], ['room', 150, 230, 233, 150, 'R. Dosen'], ['open', 383, 80, 234, 150, 'Koridor Terbuka'], ['room', 383, 230, 70, 150, 'R. Kecil'], ['circulation', 453, 230, 94, 150, 'Tangga'], ['room', 547, 230, 70, 150, 'R. HME'], ['room', 617, 80, 233, 150, 'Ruang Seminar Lt. 2'], ['room', 617, 230, 233, 150, 'RK f24'], ['circulation', 450, 380, 100, 180, 'Lorong'], ['room', 250, 600, 500, 90, 'Lab Lt. 2'], ['room', 250, 690, 167, 90, 'RK2'], ['circulation', 417, 690, 166, 90, 'Tangga'], ['room', 583, 690, 167, 90, 'RK1'],
  ],
}

function interpolate(x, y, points) {
  if (!points.length) return 'Bad'
  let total = 0; let weights = 0
  points.forEach((point) => { const distance = Math.hypot(x - point.x, y - point.y); const weight = distance < 4 ? 9999 : 1 / (distance * distance); total += weight * scoreFromCategory(point.predicted); weights += weight })
  return categoryFromScore(total / weights)
}

export default function FloorPlan({ floor, points, selected, onSelect }) {
  const cells = useMemo(() => Array.from({ length: 25 * 20 }, (_, i) => {
    const col = i % 25; const row = Math.floor(i / 25); const x = col * 40; const y = row * 40
    return { i, x, y, category: interpolate(x + 20, y + 20, points) }
  }), [points])
  const selectNearest = (event) => {
    const rect = event.currentTarget.getBoundingClientRect(); const x = (event.clientX - rect.left) / rect.width * 1000; const y = (event.clientY - rect.top) / rect.height * 800
    onSelect(points.reduce((best, point) => !best || Math.hypot(point.x - x, point.y - y) < Math.hypot(best.x - x, best.y - y) ? point : best, null))
  }
  return <div className="plan-wrap"><svg className="building-plan" viewBox="0 0 1000 800" role="img" aria-label={`Denah Gedung Teknik Elektro Lantai ${floor}`} onClick={selectNearest}>
    <g className="heatmap-layer">{cells.map((cell) => <rect key={cell.i} x={cell.x} y={cell.y} width="40" height="40" fill={colors[cell.category]} />)}</g>
    <g className="building-base"><text className="block-label" x="500" y="67">GEDUNG UTAMA</text><rect className="building-outline" x="150" y="80" width="700" height="300" /><text className="block-label" x="500" y="592">GEDUNG LAB</text><rect className="building-outline" x="250" y="600" width="500" height="180" />{rooms[floor].map(([type, x, y, width, height, label]) => <g key={`${x}-${y}`}><rect className={`plan-room ${type}`} x={x} y={y} width={width} height={height} /><text className="plan-label" x={x + width / 2} y={y + height / 2}>{label}</text></g>)}</g>
    <g className="checkpoint-layer">{points.map((point) => <g key={point.checkpoint_id} className={`checkpoint-dot ${selected?.checkpoint_id === point.checkpoint_id ? 'selected' : ''}`} transform={`translate(${point.x},${point.y})`} onClick={(event) => { event.stopPropagation(); onSelect(point) }}><circle r="15" /><text y="4">{point.checkpoint_id.replace('CP-', '')}</text></g>)}</g>
  </svg></div>
}
