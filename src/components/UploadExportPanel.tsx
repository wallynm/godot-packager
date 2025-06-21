import React, { useCallback } from 'react'
import { tv } from 'tailwind-variants'
import { exportLayerStack } from '../utils/uploadUtils'
import type { UploadedLayer } from '../types/sprite'

const exportPanel = tv({
  slots: {
    container: 'p-6 bg-white rounded-lg shadow-sm border',
    title: 'text-lg font-semibold mb-4',
    section: 'mb-6',
    sectionTitle: 'text-sm font-medium text-gray-700 mb-2',
    buttonGroup: 'flex flex-wrap gap-2',
    button: 'px-4 py-2 rounded-md font-medium transition-colors',
    primaryButton: 'bg-blue-600 text-white hover:bg-blue-700',
    secondaryButton: 'bg-gray-100 text-gray-700 hover:bg-gray-200 border',
    exportConfig: 'space-y-3 p-4 bg-gray-50 rounded-lg',
    configRow: 'flex items-center justify-between',
    configLabel: 'text-sm font-medium text-gray-700',
    configInput: 'px-3 py-1 border rounded text-sm w-24',
    layerPreview: 'space-y-2 max-h-32 overflow-y-auto',
    layerItem: 'flex items-center space-x-2 text-sm',
    layerIndicator: 'w-3 h-3 rounded-full',
    baseIndicator: 'bg-green-500',
    additionalIndicator: 'bg-blue-500',
    layerName: 'truncate'
  }
})

type UploadExportPanelProps = {
  layers: UploadedLayer[]
  canvasSize: { width: number; height: number }
  onExport?: (format: 'png' | 'json' | 'godot', data: string | Blob) => void
  onConfigChange?: (config: { width: number; height: number; name: string }) => void
}

const UploadExportPanel = ({ layers, canvasSize, onExport, onConfigChange }: UploadExportPanelProps) => {
  const styles = exportPanel()
  const [exportName, setExportName] = React.useState('character')
  const [exportWidth, setExportWidth] = React.useState(canvasSize.width)
  const [exportHeight, setExportHeight] = React.useState(canvasSize.height)

  // Update local state when canvasSize prop changes
  React.useEffect(() => {
    setExportWidth(canvasSize.width)
    setExportHeight(canvasSize.height)
  }, [canvasSize.width, canvasSize.height])

  const visibleLayers = layers.filter(layer => layer.visible)
  const baseLayers = visibleLayers.filter(layer => layer.isBase)
  const additionalLayers = visibleLayers.filter(layer => !layer.isBase)

  const exportToPNG = useCallback(async () => {
    if (visibleLayers.length === 0) return

    const canvas = document.createElement('canvas')
    canvas.width = exportWidth
    canvas.height = exportHeight
    const ctx = canvas.getContext('2d')
    
    if (!ctx) return

    // Sort layers by z-index
    const sortedLayers = [...visibleLayers].sort((a, b) => a.position.zIndex - b.position.zIndex)

    try {
      // Draw each layer
      for (const layer of sortedLayers) {
        const img = new Image()
        await new Promise<void>((resolve, reject) => {
          img.onload = () => {
            ctx.globalAlpha = layer.opacity
            ctx.drawImage(
              img,
              layer.position.x,
              layer.position.y,
              layer.width,
              layer.height
            )
            resolve()
          }
          img.onerror = reject
          img.src = layer.imageData
        })
      }

      canvas.toBlob((blob) => {
        if (blob && onExport) {
          onExport('png', blob)
        }
      }, 'image/png')
    } catch (error) {
      console.error('Error exporting to PNG:', error)
    }
  }, [visibleLayers, exportWidth, exportHeight, onExport])

  const exportToJSON = useCallback(() => {
    const jsonData = exportLayerStack(visibleLayers)
    if (onExport) {
      onExport('json', jsonData)
    }
  }, [visibleLayers, onExport])

  const exportToGodot = useCallback(() => {
    const godotResource = `[gd_resource type="Resource" format=3]

[resource]
name = "${exportName}"
layers = [
${visibleLayers.map(layer => `  {
    "id": "${layer.id}",
    "name": "${layer.name}",
    "position": Vector2(${layer.position.x}, ${layer.position.y}),
    "size": Vector2(${layer.width}, ${layer.height}),
    "z_index": ${layer.position.zIndex},
    "opacity": ${layer.opacity},
    "visible": ${layer.visible},
    "is_base": ${layer.isBase}
  }`).join(',\n')}
]
canvas_size = Vector2(${exportWidth}, ${exportHeight})
export_name = "${exportName}"
`

    if (onExport) {
      onExport('godot', godotResource)
    }
  }, [visibleLayers, exportName, exportWidth, exportHeight, onExport])

  const downloadFile = useCallback((data: string | Blob, filename: string, mimeType: string) => {
    const blob = data instanceof Blob ? data : new Blob([data], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }, [])

  const handleExport = useCallback((format: 'png' | 'json' | 'godot') => {
    if (!onExport) {
      // If no external handler, use internal download logic
      const timestamp = new Date().toISOString().slice(0, 10)
      const baseFilename = `${exportName}_${timestamp}`
      
      const internalExportHandler = (exportFormat: 'png' | 'json' | 'godot', data: string | Blob) => {
        switch (exportFormat) {
          case 'png':
            downloadFile(data, `${baseFilename}.png`, 'image/png')
            break
          case 'json':
            downloadFile(data, `${baseFilename}.json`, 'application/json')
            break
          case 'godot':
            downloadFile(data, `${baseFilename}.tres`, 'text/plain')
            break
        }
      }

      // Temporarily override onExport for this call
      switch (format) {
        case 'png':
          exportToPNG()
          break
        case 'json': {
          const jsonData = exportLayerStack(visibleLayers)
          internalExportHandler('json', jsonData)
          break
        }
        case 'godot': {
          const godotData = `[gd_resource type="Resource" format=3]

[resource]
name = "${exportName}"
layers = [
${visibleLayers.map(layer => `  {
    "id": "${layer.id}",
    "name": "${layer.name}",
    "position": Vector2(${layer.position.x}, ${layer.position.y}),
    "size": Vector2(${layer.width}, ${layer.height}),
    "z_index": ${layer.position.zIndex},
    "opacity": ${layer.opacity},
    "visible": ${layer.visible},
    "is_base": ${layer.isBase}
  }`).join(',\n')}
]
canvas_size = Vector2(${exportWidth}, ${exportHeight})
export_name = "${exportName}"
`
          internalExportHandler('godot', godotData)
          break
        }
      }
    } else {
      // Use external handler
      switch (format) {
        case 'png':
          exportToPNG()
          break
        case 'json':
          exportToJSON()
          break
        case 'godot':
          exportToGodot()
          break
      }
    }
  }, [exportName, exportToPNG, exportToJSON, exportToGodot, onExport, downloadFile, visibleLayers, exportWidth, exportHeight])

  return (
    <div className={styles.container()}>
      <h2 className={styles.title()}>Export Character</h2>
      
      <div className={styles.section()}>
        <h3 className={styles.sectionTitle()}>Export Configuration</h3>
        <div className={styles.exportConfig()}>
          <div className={styles.configRow()}>
            <label className={styles.configLabel()}>Name:</label>
            <input
              type="text"
              value={exportName}
              onChange={(e) => {
                const newName = e.target.value
                setExportName(newName)
                onConfigChange?.({ width: exportWidth, height: exportHeight, name: newName })
              }}
              className={styles.configInput()}
              placeholder="character"
            />
          </div>
          <div className={styles.configRow()}>
            <label className={styles.configLabel()}>Width:</label>
            <input
              type="number"
              value={exportWidth}
              onChange={(e) => {
                const newWidth = Number(e.target.value)
                setExportWidth(newWidth)
                onConfigChange?.({ width: newWidth, height: exportHeight, name: exportName })
              }}
              className={styles.configInput()}
              min="1"
            />
          </div>
          <div className={styles.configRow()}>
            <label className={styles.configLabel()}>Height:</label>
            <input
              type="number"
              value={exportHeight}
              onChange={(e) => {
                const newHeight = Number(e.target.value)
                setExportHeight(newHeight)
                onConfigChange?.({ width: exportWidth, height: newHeight, name: exportName })
              }}
              className={styles.configInput()}
              min="1"
            />
          </div>
        </div>
      </div>

      <div className={styles.section()}>
        <h3 className={styles.sectionTitle()}>Layers to Export ({visibleLayers.length})</h3>
        <div className={styles.layerPreview()}>
          {baseLayers.map(layer => (
            <div key={layer.id} className={styles.layerItem()}>
              <div className={`${styles.layerIndicator()} ${styles.baseIndicator()}`} />
              <span className={styles.layerName()}>{layer.name} (Base)</span>
            </div>
          ))}
          {additionalLayers
            .sort((a, b) => b.position.zIndex - a.position.zIndex)
            .map(layer => (
              <div key={layer.id} className={styles.layerItem()}>
                <div className={`${styles.layerIndicator()} ${styles.additionalIndicator()}`} />
                <span className={styles.layerName()}>{layer.name}</span>
              </div>
            ))}
        </div>
      </div>

      <div className={styles.section()}>
        <h3 className={styles.sectionTitle()}>Export Formats</h3>
        <div className={styles.buttonGroup()}>
          <button
            onClick={() => handleExport('png')}
            disabled={visibleLayers.length === 0}
            className={`${styles.button()} ${styles.primaryButton()}`}
          >
            Export PNG
          </button>
          <button
            onClick={() => handleExport('json')}
            disabled={visibleLayers.length === 0}
            className={`${styles.button()} ${styles.secondaryButton()}`}
          >
            Export JSON
          </button>
          <button
            onClick={() => handleExport('godot')}
            disabled={visibleLayers.length === 0}
            className={`${styles.button()} ${styles.secondaryButton()}`}
          >
            Export Godot (.tres)
          </button>
        </div>
      </div>
    </div>
  )
}

export default UploadExportPanel 