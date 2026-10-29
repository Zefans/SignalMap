import { useEffect, useMemo, useRef, useState } from 'react'
import { attachCoordinates, currentTimeOfDay, demoMeasurements, providers, scoreFromCategory, timeAnchors } from './data.js'
import FloorPlan from './FloorPlan.jsx'

const categoryClass = { Excellent: 'excellent', Good: 'good', Low: 'low', Bad: 'bad' }

function parseUpload(file, onData) {
  const cleanCell = (cell) => cell.trim().replace(/^"|"$/g, '').replace(/""/g, '"')
  const reader = new FileReader()
  reader.onload = () => {
    const text = String(reader.result).replace(/^\uFEFF/, '')
    const delimiter = text.split('\n')[0]?.includes(';') ? ';' : ','
    const lines = text.trim().split(/\r?\n/).filter(Boolean)
    const header = lines.shift().split(delimiter).map((cell) => cleanCell(cell).toLowerCase())
    const rows = lines.map((line) => Object.fromEntries(line.split(delimiter).map((cell, i) => [header[i], cleanCell(cell)])))
    onData(attachCoordinates(rows))
  }
  reader.readAsText(file)
}

function App() {
  // 🔧 [BARU] Jam pengunjung dicek tiap detik -> dipakai buat nentuin
  // kategori waktu (Pagi/Siang/Sore) yang otomatis menyesuaikan diri
  // dengan jam saat web diakses, tanpa perlu reload.
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000)
    return () => clearInterval(id)
  }, [])
  const waktu = useMemo(() => currentTimeOfDay(now), [now])
  const jamText = now.toLocaleTimeString('id-ID', { hour12: false })

  const [isDemo, setIsDemo] = useState(true)
  const [data, setData] = useState(() => demoMeasurements(waktu))
  // Data demo ikut berubah otomatis kalau kategori waktu berpindah (mis. dari
  // Pagi ke Siang) SELAMA masih mode demo. Data hasil upload CSV TIDAK ditimpa.
  useEffect(() => { if (isDemo) setData(demoMeasurements(waktu)) }, [waktu, isDemo])

  const [provider, setProvider] = useState('Telkomsel')
  const [floor, setFloor] = useState(1)
  const [selected, setSelected] = useState(null)
  const [page, setPage] = useState('peta')
  const fileInput = useRef(null)
  // 🔧 [MODIF] Filter tambahan: item.waktu == null (data lama/tanpa timestamp
  // yang bisa dibaca) tetap ditampilkan di semua waktu, biar tidak "hilang".
  const points = useMemo(() => data.filter((item) => item.provider === provider && item.lantai === floor && (item.waktu == null || item.waktu === waktu)), [data, provider, floor, waktu])
  const detail = selected && (selected.provider === provider && selected.lantai === floor) ? selected : points[0]
  const best = useMemo(() => points.reduce((winner, point) => !winner || scoreFromCategory(point.predicted) > scoreFromCategory(winner.predicted) || (point.predicted === winner.predicted && point.rsrp > winner.rsrp) ? point : winner, null), [points])
  const comparisons = detail ? providers.map((name) => data.find((row) => row.provider === name && row.checkpoint_id === detail.checkpoint_id && (row.waktu == null || row.waktu === waktu))) : []
  const chooseFloor = (value) => { setFloor(value); setSelected(null) }
  const loadUploadedData = (rows) => { setData(rows); setIsDemo(false) }

  return <main>
    <header><div className="brand"><div className="brand-mark">⌁</div><div><strong>SignalMap</strong><small>Gedung Teknik Elektro · Universitas Nusa Cendana</small></div></div><nav><button className={page === 'peta' ? 'active' : ''} onClick={() => setPage('peta')}>Peta Sinyal</button><button className={page === 'tentang' ? 'active' : ''} onClick={() => setPage('tentang')}>Tentang Penelitian</button></nav></header>
    {page === 'tentang' ? <About /> : <>
      <section className="hero"><div><p className="eyebrow">DASHBOARD KUALITAS JARINGAN</p><h1>Temukan sinyal terbaik<br />di setiap sudut gedung.</h1><p className="subcopy">Peta prediksi kualitas sinyal berdasarkan data walk test dan konteks lokasi.</p></div><button className="upload" onClick={() => fileInput.current.click()}>↑ Unggah data survei <small>CSV</small></button><input ref={fileInput} type="file" accept=".csv,text/csv" hidden onChange={(event) => event.target.files[0] && parseUpload(event.target.files[0], loadUploadedData)} /></section>
      <section className="controls"><div className="control-group"><span>Lantai</span><div className="segmented">{[1, 2].map((value) => <button key={value} className={floor === value ? 'selected' : ''} onClick={() => chooseFloor(value)}>Lantai {value}</button>)}</div></div><div className="control-group"><span>Provider</span><div className="provider-tabs">{providers.map((name) => <button key={name} className={provider === name ? 'selected' : ''} onClick={() => { setProvider(name); setSelected(null) }}>{name}</button>)}</div></div><div className="data-note">
        <span>🕒 {jamText} · Waktu: <b>{waktu}</b> <small>(acuan {timeAnchors[waktu]}:00)</small></span>
        <span className="sep">·</span>
        <span>{isDemo ? 'Data demo aktif' : `${data.length} data survei dimuat`}</span>
      </div></section>
      <section className="dashboard"><div className="map-card"><div className="card-heading"><div><p className="eyebrow">HEATMAP PREDIKSI</p><h2>{provider} · Lantai {floor}</h2></div><span className="idw-badge">Interpolasi IDW · 0–1000 × 0–800</span></div><FloorPlan floor={floor} points={points} selected={detail} onSelect={setSelected} /><div className="legend"><span><i className="excellent" />Excellent</span><span><i className="good" />Good</span><span><i className="low" />Low</span><span><i className="bad" />Bad</span><em>Klik area atau checkpoint untuk melihat detail</em></div></div>
        <aside className="sidebar"><section className="info-card"><p className="eyebrow">DETAIL LOKASI</p>{detail ? <><h2>{detail.checkpoint_id}</h2><p className="muted">Lantai {detail.lantai} · {detail.zona}</p><div className={`quality ${categoryClass[detail.predicted]}`}><span>Kategori prediksi</span><strong>{detail.predicted}</strong></div><dl><div><dt>RSRP aktual</dt><dd>{detail.rsrp} <small>dBm</small></dd></div><div><dt>RSRQ aktual</dt><dd>{detail.rsrq ?? 'Tidak tersedia'} {detail.rsrq != null && <small>dB</small>}</dd></div></dl><p className="model-note">Prediksi memakai checkpoint, lantai, dan zona — bukan nilai RSRP sebagai fitur masukan.</p></> : <p>Belum ada titik pada filter ini.</p>}</section>
          <section className="recommendation"><div className="spark">★</div><div><p className="eyebrow">REKOMENDASI</p><h3>Sinyal terbaik</h3>{best ? <p><b>{best.checkpoint_id}</b> · {best.zona}<br /><span className={categoryClass[best.predicted]}>{best.predicted}</span> · {best.rsrp} dBm</p> : <p>Belum ada data untuk filter ini.</p>}<button disabled={!best} onClick={() => setSelected(best)}>Lihat lokasi →</button></div></section>
          <section className="compare-card"><p className="eyebrow">BANDINGKAN PROVIDER</p><h3>{detail?.checkpoint_id ?? 'Pilih checkpoint'}</h3>{comparisons.map((item) => item && <div className="compare-row" key={item.provider}><span>{item.provider}</span><b className={categoryClass[item.predicted]}>{item.predicted}</b><small>{item.rsrp} dBm</small></div>)}</section></aside></section>
    </>}
  </main>
}

function About() { return <section className="about"><p className="eyebrow">METODOLOGI PENELITIAN</p><h1>Dari walk test ke peta<br />yang mudah dibaca.</h1><div className="about-grid"><article><span>01</span><h2>Pengumpulan data</h2><p>Walk test pada checkpoint yang sudah ditetapkan di dua lantai. Nilai RSRP dan RSRQ dicatat untuk Telkomsel, Smartfren, dan Indosat.</p></article><article><span>02</span><h2>Klasifikasi model</h2><p>Decision Tree atau Random Forest memprediksi kategori Excellent, Good, Low, dan Bad dari koordinat checkpoint, lantai, serta zona Indoor/Semi-outdoor/Outdoor (LOS/NLOS).</p></article><article><span>03</span><h2>Visualisasi IDW</h2><p>Skor kategori prediksi pada checkpoint diinterpolasi dengan Inverse Distance Weighting sehingga transisi kualitas sinyal antar titik dapat dibaca sebagai heatmap.</p></article></div><section className="model-box"><h2>Hasil model</h2><p>Masukkan hasil eksperimen final Anda di sini sebelum demo sidang: algoritma terpilih, akurasi, precision/recall, dan confusion matrix. Aplikasi ini sengaja tidak memakai RSRP sebagai fitur prediksi agar evaluasi model tidak mengalami kebocoran label.</p><div><b>Algoritma:</b> Decision Tree / Random Forest &nbsp; <b>Fitur:</b> Koordinat checkpoint, lantai, zona LOS/NLOS &nbsp; <b>Target:</b> Kategori kualitas sinyal</div></section></section> }

export default App
