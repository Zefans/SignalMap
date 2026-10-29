export const providers = ['Telkomsel', 'Smartfren', 'Indosat']

// ============================================================
// 🔧 [BARU] KATEGORI WAKTU DALAM SEHARI (Pagi/Siang/Sore)
// ============================================================
// Titik acuan cuma 3 (sesuai rencana survei): Pagi jam 7, Siang jam 10,
// Sore jam 15. Buat jam-jam DI ANTARA/DI LUAR ketiga titik itu, dipilih
// kategori dengan JARAK TERDEKAT (jarak melingkar 24 jam, supaya tengah
// malam tetap dapat kategori yang masuk akal, bukan error/kosong).
//
// Konsekuensi batasnya (hasil otomatis dari titik tengah antar acuan):
//   23:00 - 08:29  -> Pagi   (termasuk tengah malam -- tidak ada kategori
//                              "Malam" terpisah, jadi jam 2 pagi pun masuk sini)
//   08:30 - 12:29  -> Siang
//   12:30 - 22:59  -> Sore
export const timeAnchors = { Pagi: 7, Siang: 10, Sore: 15 }

export function timeOfDayFromHour(hourDecimal) {
  let best = null; let bestDist = Infinity
  for (const [label, anchor] of Object.entries(timeAnchors)) {
    const diff = Math.abs(hourDecimal - anchor)
    const dist = Math.min(diff, 24 - diff) // jarak melingkar, biar lewat tengah malam tetap benar
    if (dist < bestDist) { bestDist = dist; best = label }
  }
  return best
}

// Ambil kategori waktu dari objek Date (default: waktu SAAT INI di perangkat pengunjung)
export function currentTimeOfDay(date = new Date()) {
  const hourDecimal = date.getHours() + date.getMinutes() / 60 + date.getSeconds() / 3600
  return timeOfDayFromHour(hourDecimal)
}

// Ambil jam:menit:detik desimal dari timestamp G-NetTrack ("2026.09.11_09.45.07")
// ATAU format jam biasa ("09:45:07") -- ambil 3 angka terakhir dipisah . atau :
export function parseHourFromTimestamp(ts) {
  if (!ts) return null
  const match = String(ts).match(/(\d{1,2})[.:](\d{2})[.:](\d{2})\s*$/)
  if (!match) return null
  const [, h, m, s] = match
  return Number(h) + Number(m) / 60 + Number(s) / 3600
}

export const checkpointLayout = {
  1: [
    ['CP-01', 266, 155, 'Indoor'], ['CP-02', 266, 305, 'Indoor'], ['CP-03', 500, 155, 'Semi-outdoor'],
    ['CP-04', 733, 155, 'Indoor'], ['CP-05', 733, 305, 'Indoor'], ['CP-06', 500, 305, 'Indoor'],
    ['CP-07', 500, 470, 'Semi-outdoor'], ['CP-08', 290, 465, 'Outdoor'], ['CP-09', 725, 430, 'Semi-outdoor'],
    ['CP-10', 333, 650, 'Indoor'], ['CP-11', 500, 650, 'Indoor'], ['CP-12', 666, 650, 'Indoor'],
    ['CP-13', 333, 740, 'Indoor'], ['CP-14', 500, 740, 'Indoor'], ['CP-15', 666, 740, 'Indoor'],
    ['CP-28', 290, 32, 'Outdoor'], // 🔧 [BARU] Lopo & Parkiran (Depan) -- lihat FloorPlan.jsx
  ],
  2: [
    ['CP-16', 266, 155, 'Indoor'], ['CP-17', 266, 305, 'Indoor'], ['CP-18', 500, 155, 'Semi-outdoor'],
    ['CP-19', 733, 155, 'Indoor'], ['CP-20', 733, 305, 'Indoor'], ['CP-21', 418, 305, 'Indoor'],
    ['CP-22', 582, 305, 'Indoor'], ['CP-23', 500, 470, 'Semi-outdoor'], ['CP-24', 500, 650, 'Indoor'],
    ['CP-25', 333, 740, 'Indoor'], ['CP-26', 500, 740, 'Indoor'], ['CP-27', 666, 740, 'Indoor'],
  ],
}

export const categoryFromRsrp = (rsrp) => rsrp >= -80 ? 'Excellent' : rsrp >= -90 ? 'Good' : rsrp >= -100 ? 'Low' : 'Bad'
export const scoreFromCategory = (category) => ({ Excellent: 4, Good: 3, Low: 2, Bad: 1 }[category] ?? 1)
export const categoryFromScore = (score) => score >= 3.5 ? 'Excellent' : score >= 2.5 ? 'Good' : score >= 1.5 ? 'Low' : 'Bad'

// ============================================================
// 🔧 [BARU] HASIL TRAINING DECISION TREE (percobaan awal / dummy)
// ============================================================
// Dihasilkan dari 78 baris walk test mentah -> diagregasi (median RSRP
// per lokasi x provider) -> jadi 13 baris unik -> dilatih Decision Tree
// (max_depth=3) -> diprediksi ulang untuk seluruh 27 checkpoint x 3
// provider di checkpointLayout.
//
// ⚠️ PERINGATAN -- BACA SEBELUM DIPAKAI DI LAPORAN/SIDANG:
// 13 baris training itu SANGAT KECIL (baru nyakup 6 dari 27 checkpoint,
// dari satu rute jalan singkat). Konsekuensi nyata yang KELIHATAN di
// tabel ini:
//   - Smartfren SELALU diprediksi "Bad" di semua 27 checkpoint --
//     karena di data training, keenam baris Smartfren KEBETULAN semua
//     berkategori "Bad" (tidak ada variasi buat model dipelajari).
//   - Indosat SELALU diprediksi "Bad" -- karena Indosat TIDAK PUNYA
//     baris training sama sekali (data belum tersedia).
//   - Cuma Telkomsel yang variatif (Low/Good) karena cuma provider itu
//     yang datanya cukup bervariasi.
// Ini BUKAN temuan ilmiah, ini artefak dari data yang masih terlalu
// sedikit. Jangan disajikan sebagai hasil final -- ganti tabel ini
// begitu survei penuh (27 checkpoint x tiap provider, beberapa kali
// ulangan) sudah dilakukan. Lihat train_model.py / cara generate ulang
// di catatan project.
const MODEL_PREDICTIONS = {"CP-01": {"Telkomsel": "Good", "Smartfren": "Bad", "Indosat": "Bad"}, "CP-02": {"Telkomsel": "Good", "Smartfren": "Bad", "Indosat": "Bad"}, "CP-03": {"Telkomsel": "Low", "Smartfren": "Bad", "Indosat": "Bad"}, "CP-04": {"Telkomsel": "Good", "Smartfren": "Bad", "Indosat": "Bad"}, "CP-05": {"Telkomsel": "Good", "Smartfren": "Bad", "Indosat": "Bad"}, "CP-06": {"Telkomsel": "Good", "Smartfren": "Bad", "Indosat": "Bad"}, "CP-07": {"Telkomsel": "Low", "Smartfren": "Bad", "Indosat": "Bad"}, "CP-08": {"Telkomsel": "Low", "Smartfren": "Bad", "Indosat": "Bad"}, "CP-09": {"Telkomsel": "Low", "Smartfren": "Bad", "Indosat": "Bad"}, "CP-10": {"Telkomsel": "Good", "Smartfren": "Bad", "Indosat": "Bad"}, "CP-11": {"Telkomsel": "Good", "Smartfren": "Bad", "Indosat": "Bad"}, "CP-12": {"Telkomsel": "Good", "Smartfren": "Bad", "Indosat": "Bad"}, "CP-13": {"Telkomsel": "Good", "Smartfren": "Bad", "Indosat": "Bad"}, "CP-14": {"Telkomsel": "Good", "Smartfren": "Bad", "Indosat": "Bad"}, "CP-15": {"Telkomsel": "Good", "Smartfren": "Bad", "Indosat": "Bad"}, "CP-16": {"Telkomsel": "Low", "Smartfren": "Bad", "Indosat": "Bad"}, "CP-17": {"Telkomsel": "Low", "Smartfren": "Bad", "Indosat": "Bad"}, "CP-18": {"Telkomsel": "Low", "Smartfren": "Bad", "Indosat": "Bad"}, "CP-19": {"Telkomsel": "Low", "Smartfren": "Bad", "Indosat": "Bad"}, "CP-20": {"Telkomsel": "Low", "Smartfren": "Bad", "Indosat": "Bad"}, "CP-21": {"Telkomsel": "Low", "Smartfren": "Bad", "Indosat": "Bad"}, "CP-22": {"Telkomsel": "Low", "Smartfren": "Bad", "Indosat": "Bad"}, "CP-23": {"Telkomsel": "Low", "Smartfren": "Bad", "Indosat": "Bad"}, "CP-24": {"Telkomsel": "Low", "Smartfren": "Bad", "Indosat": "Bad"}, "CP-25": {"Telkomsel": "Low", "Smartfren": "Bad", "Indosat": "Bad"}, "CP-26": {"Telkomsel": "Low", "Smartfren": "Bad", "Indosat": "Bad"}, "CP-27": {"Telkomsel": "Low", "Smartfren": "Bad", "Indosat": "Bad"}}

// 🔧 [MODIF] Sekarang menerima checkpoint_id & provider juga.
// Urutan logika:
//   1. Kalau checkpoint_id & provider dikenal di MODEL_PREDICTIONS -> pakai itu.
//   2. Kalau tidak (checkpoint baru / provider baru / data upload custom
//      tanpa checkpoint_id yang cocok) -> fallback ke heuristic lokasi
//      lama, supaya app tidak pernah "kosong" walau modelnya belum
//      mencakup titik tersebut.
export function predictFromContext({ x, y, lantai, zona, checkpoint_id, provider }) {
  const fromModel = MODEL_PREDICTIONS[checkpoint_id]?.[provider]
  if (fromModel) return fromModel

  // --- fallback heuristic (lama) ---
  const zoneScore = { Outdoor: 4, 'Semi-outdoor': 3, Indoor: 2 }[zona] ?? 2
  const spatialAdjustment = (Math.round(Number(x) / 150) + Math.round(Number(y) / 160) + Number(lantai)) % 4 === 0 ? 1 : 0
  return categoryFromScore(Math.min(4, zoneScore + spatialAdjustment))
}

const providerOffset = { Telkomsel: 0, Smartfren: -7, Indosat: -12 }
const zoneOffset = { Indoor: -10, 'Semi-outdoor': -4, Outdoor: 2 }
// 🔧 [BARU] Variasi per waktu -- INI MASIH ASUMSI DEMO, bukan hasil survei
// beneran (survei real per Pagi/Siang/Sore belum dilakukan). Ganti fungsi
// ini / hasil MODEL_PREDICTIONS-nya begitu data 3-waktu asli sudah ada.
const waktuOffset = { Pagi: 3, Siang: -1, Sore: -4 }

export function demoMeasurements(waktu = 'Pagi') {
  return providers.flatMap((provider, providerIndex) => [1, 2].flatMap((floor) =>
    checkpointLayout[floor].map(([checkpoint_id, x, y, zona], index) => {
      const pattern = ((index * 7 + floor * 4 + providerIndex * 3) % 17) - 8
      const rsrp = -75 + providerOffset[provider] + zoneOffset[zona] + (waktuOffset[waktu] ?? 0) + pattern
      const actual = categoryFromRsrp(rsrp)
      const predicted = predictFromContext({ x, y, lantai: floor, zona, checkpoint_id, provider })
      return { timestamp: '2026-09-10 09:00', provider, rsrp, rsrq: Number((-8 - (Math.abs(pattern) / 3) - providerIndex).toFixed(1)), checkpoint_id, lantai: floor, zona, kategori: actual, predicted, x, y, waktu }
    }),
  ))
}

export function attachCoordinates(rows) {
  const layout = Object.fromEntries(Object.entries(checkpointLayout).flatMap(([floor, points]) => points.map(([id, x, y, zona]) => [id, { lantai: Number(floor), x, y, zona }])))
  return rows.map((row, i) => {
    const point = layout[row.checkpoint_id] ?? { x: Number(row.x) || 110 + (i * 137) % 780, y: Number(row.y) || 100 + (i * 97) % 620, lantai: Number(row.lantai) || 1, zona: row.zona || 'Indoor' }
    const rsrp = Number(row.rsrp)
    const x = Number(row.x) || point.x; const y = Number(row.y) || point.y; const lantai = Number(row.lantai) || point.lantai; const zona = row.zona || point.zona
    const rsrq = row.rsrq === '' || row.rsrq == null ? null : Number(row.rsrq)
    // 🔧 [BARU] Tag "waktu" (Pagi/Siang/Sore): pakai kolom eksplisit kalau
    // ada di CSV, kalau tidak coba baca dari timestamp, kalau timestamp
    // juga tidak ada/tidak kebaca -> null (baris ini akan tampil di SEMUA
    // waktu, lihat filter di App.jsx).
    const hourDecimal = parseHourFromTimestamp(row.timestamp)
    const waktu = row.waktu || (hourDecimal != null ? timeOfDayFromHour(hourDecimal) : null)
    return { ...point, ...row, x, y, lantai, zona, rsrp, rsrq, kategori: row.kategori || categoryFromRsrp(rsrp), predicted: row.predicted || predictFromContext({ x, y, lantai, zona, checkpoint_id: row.checkpoint_id, provider: row.provider }), waktu }
  })
}
