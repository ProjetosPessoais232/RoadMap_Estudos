import { toPng } from 'html-to-image'
import { jsPDF } from 'jspdf'
import { FileCode2, FileText, Image as ImageIcon } from 'lucide-react'
import { useState } from 'react'
import { noteDocToMarkdown } from './toMarkdown.js'

export default function ExportSheet({ open, targetRef, filename, doc, onClose }) {
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')

  if (!open) return null

  async function capture() {
    const node = targetRef?.current
    if (!node) throw new Error('Nada para exportar.')
    return toPng(node, { pixelRatio: 2, backgroundColor: '#fcfcfb', cacheBust: true })
  }

  function exportMarkdown() {
    const markdown = noteDocToMarkdown(doc)
    const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    download(url, `${filename}.md`)
    URL.revokeObjectURL(url)
    onClose?.()
  }

  async function exportImage() {
    setBusy('png')
    setError('')
    try {
      const dataUrl = await capture()
      download(dataUrl, `${filename}.png`)
      onClose?.()
    } catch (err) {
      setError(err.message || 'Falha ao exportar imagem.')
    } finally {
      setBusy('')
    }
  }

  async function exportPdf() {
    setBusy('pdf')
    setError('')
    try {
      const dataUrl = await capture()
      const img = await loadImage(dataUrl)
      const widthMm = 210
      const heightMm = Math.max(297, (img.height / img.width) * widthMm)
      const pdf = new jsPDF({ orientation: 'p', unit: 'mm', format: [widthMm, heightMm] })
      pdf.addImage(dataUrl, 'PNG', 0, 0, widthMm, heightMm)
      pdf.save(`${filename}.pdf`)
      onClose?.()
    } catch (err) {
      setError(err.message || 'Falha ao exportar PDF.')
    } finally {
      setBusy('')
    }
  }

  return (
    <div className="note-export" onClick={onClose}>
      <div
        className="note-export-sheet"
        onClick={(event) => event.stopPropagation()}
      >
        <h2 className="note-export-title">Exportar página</h2>
        <div className="note-export-cards">
          <button className="note-export-card" type="button" disabled={!!busy} onClick={exportMarkdown}>
            <FileCode2 size={20} />
            <strong>Markdown</strong>
            <span>Texto da aula, fences de código. Abre em qualquer editor.</span>
          </button>
          <button className="note-export-card" type="button" disabled={!!busy} onClick={exportPdf}>
            <FileText size={20} />
            <strong>PDF</strong>
            <span>{busy === 'pdf' ? 'Gerando…' : 'Uma folha A4 da página limpa, sem o rascunho.'}</span>
          </button>
          <button className="note-export-card" type="button" disabled={!!busy} onClick={exportImage}>
            <ImageIcon size={20} />
            <strong>Imagem PNG</strong>
            <span>{busy === 'png' ? 'Gerando…' : 'Recorte da página limpa, fundo #fcfcfb.'}</span>
          </button>
        </div>
        {error ? <p className="note-export-error">{error}</p> : null}
        <button className="note-export-cancel" type="button" onClick={onClose}>
          Cancelar
        </button>
      </div>
    </div>
  )
}

function download(href, name) {
  const link = document.createElement('a')
  link.href = href
  link.download = name
  link.click()
}

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Não foi possível ler a imagem.'))
    image.src = src
  })
}
