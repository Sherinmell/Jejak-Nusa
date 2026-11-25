import type { AdminActivityItem } from '#shared/types/activity'

// ============================================================================
// Pure TypeScript Zero-Dependency OOXML (.xlsx) Workbook Generator
// Produces genuine Microsoft Excel .xlsx files (ZIP + SpreadsheetML)
// Opens cleanly in Excel, Google Sheets, WPS Office & LibreOffice without warnings.
// ============================================================================

const CRC_TABLE = (() => {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let k = 0; k < 8; k++) {
      c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1)
    }
    table[i] = c >>> 0
  }
  return table
})()

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < bytes.length; i++) {
    crc = CRC_TABLE[(crc ^ bytes[i]!) & 0xff]! ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

function encodeUtf8(str: string): Uint8Array {
  return new TextEncoder().encode(str)
}

interface ZipEntry {
  name: string
  data: Uint8Array
}

function buildZipBuffer(entries: ZipEntry[]): Uint8Array {
  const localParts: Uint8Array[] = []
  const centralParts: Uint8Array[] = []
  let offset = 0

  for (const entry of entries) {
    const nameBytes = encodeUtf8(entry.name)
    const dataBytes = entry.data
    const crc = crc32(dataBytes)

    // Local file header (30 bytes + name)
    const localHeader = new Uint8Array(30 + nameBytes.length)
    const lv = new DataView(localHeader.buffer)
    lv.setUint32(0, 0x04034b50, true) // Local file header signature
    lv.setUint16(4, 20, true) // Version needed
    lv.setUint16(6, 0x0800, true) // UTF-8 filename flag
    lv.setUint16(8, 0, true) // Compression method: 0 (STORE)
    lv.setUint16(10, 0, true) // Mod time
    lv.setUint16(12, 0x5421, true) // Mod date
    lv.setUint32(14, crc, true)
    lv.setUint32(18, dataBytes.length, true)
    lv.setUint32(22, dataBytes.length, true)
    lv.setUint16(26, nameBytes.length, true)
    lv.setUint16(28, 0, true)
    localHeader.set(nameBytes, 30)

    localParts.push(localHeader, dataBytes)

    // Central directory header (46 bytes + name)
    const centralHeader = new Uint8Array(46 + nameBytes.length)
    const cv = new DataView(centralHeader.buffer)
    cv.setUint32(0, 0x02014b50, true) // Central dir signature
    cv.setUint16(4, 20, true) // Version made by
    cv.setUint16(6, 20, true) // Version needed
    cv.setUint16(8, 0x0800, true) // UTF-8 flag
    cv.setUint16(10, 0, true) // Method: STORE
    cv.setUint16(12, 0, true)
    cv.setUint16(14, 0x5421, true)
    cv.setUint32(16, crc, true)
    cv.setUint32(20, dataBytes.length, true)
    cv.setUint32(24, dataBytes.length, true)
    cv.setUint16(28, nameBytes.length, true)
    cv.setUint16(30, 0, true)
    cv.setUint16(32, 0, true)
    cv.setUint16(34, 0, true)
    cv.setUint16(36, 0, true)
    cv.setUint32(38, 0, true)
    cv.setUint32(42, offset, true)
    centralHeader.set(nameBytes, 46)

    centralParts.push(centralHeader)
    offset += localHeader.length + dataBytes.length
  }

  const centralSize = centralParts.reduce((s, b) => s + b.length, 0)

  // End of Central Directory (22 bytes)
  const eocd = new Uint8Array(22)
  const ev = new DataView(eocd.buffer)
  ev.setUint32(0, 0x06054b50, true)
  ev.setUint16(4, 0, true)
  ev.setUint16(6, 0, true)
  ev.setUint16(8, entries.length, true)
  ev.setUint16(10, entries.length, true)
  ev.setUint32(12, centralSize, true)
  ev.setUint32(16, offset, true)
  ev.setUint16(20, 0, true)

  const totalLen = offset + centralSize + eocd.length
  const out = new Uint8Array(totalLen)
  let pos = 0
  for (const part of localParts) {
    out.set(part, pos)
    pos += part.length
  }
  for (const part of centralParts) {
    out.set(part, pos)
    pos += part.length
  }
  out.set(eocd, pos)
  return out
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
}

function colIndexToLetter(idx: number): string {
  let n = idx + 1
  let result = ''
  while (n > 0) {
    const rem = (n - 1) % 26
    result = String.fromCharCode(65 + rem) + result
    n = Math.floor((n - 1) / 26)
  }
  return result
}

type CellValue = string | number | null | undefined

interface SheetRow {
  cells: CellValue[]
  styleIndex?: number
  currencyCols?: number[]
}

function buildWorksheetXml(rows: SheetRow[], colWidths: number[]): string {
  const colsXml = colWidths
    .map((w, i) => `<col min="${i + 1}" max="${i + 1}" width="${w}" customWidth="1"/>`)
    .join('')

  const rowsXml = rows
    .map((row, rIdx) => {
      const rowNum = rIdx + 1
      const cellsXml = row.cells
        .map((val, cIdx) => {
          const ref = `${colIndexToLetter(cIdx)}${rowNum}`
          const isCurrency = row.currencyCols?.includes(cIdx) && typeof val === 'number'
          const styleId = isCurrency ? 3 : (row.styleIndex ?? 0)
          const styleAttr = styleId > 0 ? ` s="${styleId}"` : ''

          if (val === null || val === undefined || val === '') {
            return `<c r="${ref}"${styleAttr}/>`
          }
          if (typeof val === 'number' && Number.isFinite(val)) {
            return `<c r="${ref}"${styleAttr}><v>${val}</v></c>`
          }
          return `<c r="${ref}" t="inlineStr"${styleAttr}><is><t xml:space="preserve">${escapeXml(String(val))}</t></is></c>`
        })
        .join('')
      return `<row r="${rowNum}">${cellsXml}</row>`
    })
    .join('')

  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <cols>${colsXml}</cols>
  <sheetData>${rowsXml}</sheetData>
</worksheet>`
}

export interface ActivityExportMeta {
  generatedAt: string
  filterLabel: string
  exportedBy: string
}

export function buildActivitiesXlsxBytes(
  activities: AdminActivityItem[],
  meta: ActivityExportMeta
): Uint8Array {
  const totalNominal = activities.reduce((sum, a) => sum + (a.amount ?? 0), 0)
  const bookingCount = activities.filter((a) => a.category === 'booking').length
  const regCount = activities.filter((a) => a.category === 'registration').length
  const commCount = activities.filter((a) => a.category === 'community').length
  const sosCount = activities.filter((a) => a.category === 'sos').length
  const verCount = activities.filter((a) => a.category === 'verification').length
  const refundCount = activities.filter((a) => a.category === 'refund').length
  const payoutCount = activities.filter((a) => a.category === 'payout').length

  // Sheet 1: Ringkasan Eksekutif
  const summaryRows: SheetRow[] = [
    { cells: ['LAPORAN AKTIVITAS MASUK — JEJAKNUSA ADMIN COMMAND CENTER', ''], styleIndex: 1 },
    { cells: ['Tanggal Cetak / Ekspor', meta.generatedAt], styleIndex: 2 },
    { cells: ['Filter Aktif', meta.filterLabel], styleIndex: 2 },
    { cells: ['Diekspor Oleh', meta.exportedBy], styleIndex: 2 },
    { cells: ['', ''] },
    { cells: ['Metrik Ringkasan', 'Nilai'], styleIndex: 1 },
    { cells: ['Total Seluruh Aktivitas Masuk', activities.length], styleIndex: 2 },
    { cells: ['Total Nilai Finansial Tercatat (Rp)', totalNominal], styleIndex: 2, currencyCols: [1] },
    { cells: ['Transaksi & Booking Masuk', bookingCount], styleIndex: 2 },
    { cells: ['Pendaftaran Akun Pengguna', regCount], styleIndex: 2 },
    { cells: ['Postingan Komunitas Buddy Finder', commCount], styleIndex: 2 },
    { cells: ['Sinyal Darurat SOS Lapangan', sosCount], styleIndex: 2 },
    { cells: ['Pengajuan Verifikasi Pemandu', verCount], styleIndex: 2 },
    { cells: ['Pengajuan Refund Garansi Cuaca', refundCount], styleIndex: 2 },
    { cells: ['Antrean & Pencairan Payout Pemandu', payoutCount], styleIndex: 2 }
  ]

  // Sheet 2: Detail Semua Aktivitas Masuk
  const detailRows: SheetRow[] = [
    {
      cells: [
        'No',
        'Waktu',
        'Kategori',
        'Aktivitas',
        'Pelaku / Akun',
        'Kontak / Keterangan Akun',
        'Kode Referensi',
        'Detail Aktivitas',
        'Nominal (Rp)',
        'Status'
      ],
      styleIndex: 1
    },
    ...activities.map((item, idx): SheetRow => ({
      cells: [
        idx + 1,
        item.timestamp,
        item.categoryLabel,
        item.title,
        item.actor,
        item.actorContact,
        item.referenceCode,
        item.description,
        item.amount ?? '',
        item.status
      ],
      styleIndex: 2,
      currencyCols: [8]
    })),
    {
      cells: ['', '', '', 'TOTAL NOMINAL TERCATAT', '', '', '', `${activities.length} aktivitas`, totalNominal, ''],
      styleIndex: 1,
      currencyCols: [8]
    }
  ]

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1">
    <numFmt numFmtId="164" formatCode="&quot;Rp &quot;#,##0"/>
  </numFmts>
  <fonts count="3">
    <font><sz val="11"/><name val="Calibri"/></font>
    <font><b/><sz val="11"/><color rgb="FFFFFFFF"/><name val="Calibri"/></font>
    <font><sz val="10"/><color rgb="FF162221"/><name val="Calibri"/></font>
  </fonts>
  <fills count="3">
    <fill><patternFill patternType="none"/></fill>
    <fill><patternFill patternType="gray125"/></fill>
    <fill><patternFill patternType="solid"><fgColor rgb="FF103F3E"/><bgColor indexed="64"/></patternFill></fill>
  </fills>
  <borders count="2">
    <border><left/><right/><top/><bottom/><diagonal/></border>
    <border>
      <left style="thin"><color rgb="FFDAD3C5"/></left>
      <right style="thin"><color rgb="FFDAD3C5"/></right>
      <top style="thin"><color rgb="FFDAD3C5"/></top>
      <bottom style="thin"><color rgb="FFDAD3C5"/></bottom>
      <diagonal/>
    </border>
  </borders>
  <cellStyleXfs count="1"><xf numFmtId="0" fontId="0" fillId="0" borderId="0"/></cellStyleXfs>
  <cellXfs count="4">
    <xf numFmtId="0" fontId="0" fillId="0" borderId="0" xfId="0"/>
    <xf numFmtId="0" fontId="1" fillId="2" borderId="1" xfId="0" applyFont="1" applyFill="1" applyBorder="1"/>
    <xf numFmtId="0" fontId="2" fillId="0" borderId="1" xfId="0" applyFont="1" applyBorder="1"/>
    <xf numFmtId="164" fontId="2" fillId="0" borderId="1" xfId="0" applyNumberFormat="1" applyFont="1" applyBorder="1"/>
  </cellXfs>
</styleSheet>`

  const contentTypesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/>
  <Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/worksheets/sheet2.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Semua Aktivitas" sheetId="1" r:id="rId1"/>
    <sheet name="Ringkasan Laporan" sheetId="2" r:id="rId2"/>
  </sheets>
</workbook>`

  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`

  const sheet1Xml = buildWorksheetXml(detailRows, [6, 22, 20, 38, 22, 30, 22, 48, 18, 20])
  const sheet2Xml = buildWorksheetXml(summaryRows, [40, 34])

  return buildZipBuffer([
    { name: '[Content_Types].xml', data: encodeUtf8(contentTypesXml) },
    { name: '_rels/.rels', data: encodeUtf8(rootRelsXml) },
    { name: 'xl/workbook.xml', data: encodeUtf8(workbookXml) },
    { name: 'xl/_rels/workbook.xml.rels', data: encodeUtf8(workbookRelsXml) },
    { name: 'xl/styles.xml', data: encodeUtf8(stylesXml) },
    { name: 'xl/worksheets/sheet1.xml', data: encodeUtf8(sheet1Xml) },
    { name: 'xl/worksheets/sheet2.xml', data: encodeUtf8(sheet2Xml) }
  ])
}

export function downloadActivitiesExcel(activities: AdminActivityItem[], meta: ActivityExportMeta) {
  const bytes = buildActivitiesXlsxBytes(activities, meta)
  const blob = new Blob([bytes.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const dateStamp = new Date().toISOString().slice(0, 10)
  const filename = `Laporan-Aktivitas-JejakNusa-${dateStamp}.xlsx`

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export function exportActivitiesPdfViaPrint() {
  const previousTitle = document.title
  const dateStamp = new Date().toISOString().slice(0, 10)
  document.title = `Laporan-Aktivitas-JejakNusa-${dateStamp}`

  const restoreTitle = () => {
    document.title = previousTitle
    window.removeEventListener('afterprint', restoreTitle)
  }
  window.addEventListener('afterprint', restoreTitle)
  window.print()
  setTimeout(restoreTitle, 3000)
}
