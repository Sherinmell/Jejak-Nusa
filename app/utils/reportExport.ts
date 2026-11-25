import type { AdminActivityItem } from '#shared/types/activity'
import type {
  AdminFinanceSummary,
  DestinationFinanceRow,
  FinanceLedgerItem
} from '#shared/types/finance'

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
        'No. Telepon / WA',
        'Email / Keterangan Akun',
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
        item.actorPhone || '-',
        item.actorContact,
        item.referenceCode,
        item.description,
        item.amount ?? '',
        item.status
      ],
      styleIndex: 2,
      currencyCols: [9]
    })),
    {
      cells: ['', '', '', 'TOTAL NOMINAL TERCATAT', '', '', '', '', `${activities.length} aktivitas`, totalNominal, ''],
      styleIndex: 1,
      currencyCols: [9]
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

  const sheet1Xml = buildWorksheetXml(detailRows, [6, 22, 20, 38, 22, 18, 28, 22, 48, 18, 20])
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

// ============================================================================
// Financial Report Export: 3-Sheet Native Excel (.xlsx) & A4 Landscape PDF
// ============================================================================

export function buildFinanceXlsxBytes(
  summary: AdminFinanceSummary,
  ledger: FinanceLedgerItem[],
  byDestination: DestinationFinanceRow[],
  meta: ActivityExportMeta
): Uint8Array {
  const filteredGrossIn = ledger
    .filter((i) => i.direction === 'MASUK')
    .reduce((sum, i) => sum + i.grossAmount, 0)
  const filteredSettledIn = ledger
    .filter((i) => i.direction === 'MASUK')
    .reduce((sum, i) => sum + i.settledAmount, 0)
  const filteredSettledOut = ledger
    .filter((i) => i.direction === 'KELUAR')
    .reduce((sum, i) => sum + i.settledAmount, 0)
  const filteredCommission = ledger.reduce((sum, i) => sum + i.platformCommission, 0)
  const filteredServiceFee = ledger.reduce((sum, i) => sum + i.serviceFee, 0)
  const filteredNetCash = ledger.reduce((sum, i) => sum + i.netCashImpact, 0)

  // Sheet 1: Ringkasan Keuangan (Executive P&L & Cash Flow)
  const summaryRows: SheetRow[] = [
    { cells: ['LAPORAN KEUANGAN & ARUS KAS — JEJAKNUSA ADMIN', '', ''], styleIndex: 1 },
    { cells: ['Tanggal Cetak / Ekspor', meta.generatedAt, ''], styleIndex: 2 },
    { cells: ['Filter Aktif', meta.filterLabel, ''], styleIndex: 2 },
    { cells: ['Diekspor Oleh', meta.exportedBy, ''], styleIndex: 2 },
    { cells: ['', '', ''] },
    { cells: ['Pos Keuangan', 'Nominal (Rp)', 'Keterangan'], styleIndex: 1 },
    { cells: ['Total GMV Bruto Platform', summary.totalGmv, `${summary.totalTransactionsCount} transaksi booking + payout`], styleIndex: 2, currencyCols: [1] },
    { cells: ['Total Tagihan Booking Masuk', summary.totalBookingGross, `Lunas: ${summary.paidTransactionsCount} • DP: ${summary.dpTransactionsCount} • Menunggu: ${summary.unpaidTransactionsCount}`], styleIndex: 2, currencyCols: [1] },
    { cells: ['Dana Riil Masuk (Cash In Booking)', summary.totalCashIn, 'Pembayaran QRIS diterima (Lunas + DP)'], styleIndex: 2, currencyCols: [1] },
    { cells: ['Sisa Piutang Peserta (Belum Dibayar)', summary.totalReceivable, 'Sisa pelunasan DP & menunggu bayar'], styleIndex: 2, currencyCols: [1] },
    { cells: ['', '', ''] },
    { cells: ['Pendapatan Platform', 'Nominal (Rp)', 'Rincian'], styleIndex: 1 },
    { cells: [`Komisi Platform (${summary.commissionPercent}%)`, summary.totalPlatformCommission, 'Akumulasi komisi booking & payout'], styleIndex: 2, currencyCols: [1] },
    { cells: ['Pendapatan Biaya Layanan Aplikasi', summary.totalServiceFee, 'Service fee per transaksi'], styleIndex: 2, currencyCols: [1] },
    { cells: ['TOTAL PENDAPATAN BERSIH PLATFORM', summary.totalPlatformNetRevenue, 'Komisi + Biaya Layanan'], styleIndex: 1, currencyCols: [1] },
    { cells: ['Titipan Asuransi Perjalanan', summary.totalInsuranceFee, 'Diteruskan ke mitra asuransi'], styleIndex: 2, currencyCols: [1] },
    { cells: ['Titipan Dana Carbon Offset', summary.totalCarbonOffsetFee, 'Program konservasi & penanaman pohon'], styleIndex: 2, currencyCols: [1] },
    { cells: ['', '', ''] },
    { cells: ['Kewajiban & Arus Kas Keluar', 'Nominal (Rp)', 'Status'], styleIndex: 1 },
    { cells: ['Payout Pemandu Sudah Dicairkan', summary.totalPayoutReleased, 'Dana keluar terealisasi'], styleIndex: 2, currencyCols: [1] },
    { cells: ['Payout Pemandu Menunggu Pencairan', summary.totalPayoutPending, 'Kewajiban escrow ke pemandu'], styleIndex: 2, currencyCols: [1] },
    { cells: ['Refund Cuaca Disetujui & Dikembalikan', summary.totalRefundApproved, 'Dana keluar terealisasi'], styleIndex: 2, currencyCols: [1] },
    { cells: ['Refund Cuaca Menunggu Persetujuan', summary.totalRefundPending, 'Potensi kewajiban garansi BMKG'], styleIndex: 2, currencyCols: [1] },
    { cells: ['Total Dana Keluar Terealisasi (Cash Out)', summary.totalCashOut, 'Payout cair + Refund disetujui'], styleIndex: 2, currencyCols: [1] },
    { cells: ['SALDO ESCROW & ARUS KAS BERSIH', summary.netEscrowBalance, 'Dana masuk dikurangi dana keluar terealisasi'], styleIndex: 1, currencyCols: [1] }
  ]

  // Sheet 2: Buku Besar Arus Kas (Filtered Ledger)
  const ledgerRows: SheetRow[] = [
    {
      cells: [
        'No',
        'Waktu',
        'Arah',
        'Jenis Transaksi',
        'Kode Referensi',
        'Destinasi / Kegiatan',
        'Pihak Terkait',
        'Metode',
        'Nilai Bruto (Rp)',
        'Realisasi (Rp)',
        'Belum Cair/Lunas (Rp)',
        'Komisi Platform (Rp)',
        'Biaya Layanan (Rp)',
        'Dampak Kas Bersih (Rp)',
        'Status'
      ],
      styleIndex: 1
    },
    ...ledger.map((item, idx): SheetRow => ({
      cells: [
        idx + 1,
        item.timestamp,
        item.direction,
        item.typeLabel,
        item.referenceCode,
        item.title,
        item.counterparty,
        item.paymentMethod,
        item.grossAmount,
        item.settledAmount,
        item.outstandingAmount,
        item.platformCommission,
        item.serviceFee,
        item.netCashImpact,
        item.status
      ],
      styleIndex: 2,
      currencyCols: [8, 9, 10, 11, 12, 13]
    })),
    {
      cells: [
        '',
        '',
        '',
        'TOTAL BUKU BESAR (TERFILTER)',
        `${ledger.length} entri`,
        `Masuk Bruto: Rp ${filteredGrossIn.toLocaleString('id-ID')}`,
        `Realisasi Masuk: Rp ${filteredSettledIn.toLocaleString('id-ID')}`,
        `Realisasi Keluar: Rp ${filteredSettledOut.toLocaleString('id-ID')}`,
        ledger.reduce((s, i) => s + i.grossAmount, 0),
        ledger.reduce((s, i) => s + i.settledAmount, 0),
        ledger.reduce((s, i) => s + i.outstandingAmount, 0),
        filteredCommission,
        filteredServiceFee,
        filteredNetCash,
        ''
      ],
      styleIndex: 1,
      currencyCols: [8, 9, 10, 11, 12, 13]
    }
  ]

  // Sheet 3: Pendapatan per Destinasi
  const destRows: SheetRow[] = [
    {
      cells: [
        'No',
        'Destinasi / Paket Trip',
        'Lokasi',
        'Jumlah Transaksi',
        'Total Peserta',
        'Pendapatan Bruto (Rp)',
        'Sudah Dibayar (Rp)',
        'Sisa Piutang (Rp)',
        `Estimasi Komisi ${summary.commissionPercent}% (Rp)`
      ],
      styleIndex: 1
    },
    ...byDestination.map((d, idx): SheetRow => ({
      cells: [
        idx + 1,
        d.tripTitle,
        d.location,
        d.bookingsCount,
        d.participantsCount,
        d.grossRevenue,
        d.paidRevenue,
        d.unpaidRevenue,
        d.estimatedCommission
      ],
      styleIndex: 2,
      currencyCols: [5, 6, 7, 8]
    })),
    {
      cells: [
        '',
        'TOTAL SELURUH DESTINASI',
        `${byDestination.length} destinasi`,
        byDestination.reduce((s, d) => s + d.bookingsCount, 0),
        byDestination.reduce((s, d) => s + d.participantsCount, 0),
        byDestination.reduce((s, d) => s + d.grossRevenue, 0),
        byDestination.reduce((s, d) => s + d.paidRevenue, 0),
        byDestination.reduce((s, d) => s + d.unpaidRevenue, 0),
        byDestination.reduce((s, d) => s + d.estimatedCommission, 0)
      ],
      styleIndex: 1,
      currencyCols: [5, 6, 7, 8]
    }
  ]

  const stylesXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<styleSheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main">
  <numFmts count="1">
    <numFmt numFmtId="164" formatCode="&quot;Rp &quot;#,##0;&quot;-Rp &quot;#,##0;&quot;Rp &quot;0"/>
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
  <Override PartName="/xl/worksheets/sheet3.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/>
  <Override PartName="/xl/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.styles+xml"/>
</Types>`

  const rootRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/>
</Relationships>`

  const workbookXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships">
  <sheets>
    <sheet name="Ringkasan Keuangan" sheetId="1" r:id="rId1"/>
    <sheet name="Buku Besar Arus Kas" sheetId="2" r:id="rId2"/>
    <sheet name="Pendapatan Destinasi" sheetId="3" r:id="rId3"/>
  </sheets>
</workbook>`

  const workbookRelsXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/>
  <Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet2.xml"/>
  <Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet3.xml"/>
  <Relationship Id="rId4" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/>
</Relationships>`

  const sheet1Xml = buildWorksheetXml(summaryRows, [42, 22, 42])
  const sheet2Xml = buildWorksheetXml(ledgerRows, [6, 22, 10, 20, 22, 36, 22, 24, 18, 18, 18, 18, 16, 20, 22])
  const sheet3Xml = buildWorksheetXml(destRows, [6, 40, 24, 16, 14, 20, 20, 20, 22])

  return buildZipBuffer([
    { name: '[Content_Types].xml', data: encodeUtf8(contentTypesXml) },
    { name: '_rels/.rels', data: encodeUtf8(rootRelsXml) },
    { name: 'xl/workbook.xml', data: encodeUtf8(workbookXml) },
    { name: 'xl/_rels/workbook.xml.rels', data: encodeUtf8(workbookRelsXml) },
    { name: 'xl/styles.xml', data: encodeUtf8(stylesXml) },
    { name: 'xl/worksheets/sheet1.xml', data: encodeUtf8(sheet1Xml) },
    { name: 'xl/worksheets/sheet2.xml', data: encodeUtf8(sheet2Xml) },
    { name: 'xl/worksheets/sheet3.xml', data: encodeUtf8(sheet3Xml) }
  ])
}

export function downloadFinanceExcel(
  summary: AdminFinanceSummary,
  ledger: FinanceLedgerItem[],
  byDestination: DestinationFinanceRow[],
  meta: ActivityExportMeta
) {
  const bytes = buildFinanceXlsxBytes(summary, ledger, byDestination, meta)
  const blob = new Blob([bytes.buffer as ArrayBuffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  })
  const dateStamp = new Date().toISOString().slice(0, 10)
  const filename = `Laporan-Keuangan-JejakNusa-${dateStamp}.xlsx`

  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1500)
}

export function exportFinancePdfViaPrint() {
  const previousTitle = document.title
  const dateStamp = new Date().toISOString().slice(0, 10)
  document.title = `Laporan-Keuangan-JejakNusa-${dateStamp}`

  const restoreTitle = () => {
    document.title = previousTitle
    window.removeEventListener('afterprint', restoreTitle)
  }
  window.addEventListener('afterprint', restoreTitle)
  window.print()
  setTimeout(restoreTitle, 3000)
}
