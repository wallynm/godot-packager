import { useCallback } from 'react'
import { tv } from 'tailwind-variants'
import type { UploadedLayer } from '../types/sprite'
import { exportLayerStack } from '../utils/uploadUtils'

type UploadExportPanelProps = {
  baseLayer: UploadedLayer | null
  additionalLayers: UploadedLayer[]
}

const exportButton = tv({
  base: 'px-4 py-2 rounded-lg font-medium transition-all duration-200 flex items-center space-x-2',
  variants: {
    variant: {
      primary: 'bg-blue-600 text-white hover:bg-blue-700',
      secondary: 'bg-gray-600 text-white hover:bg-gray-700',
      success: 'bg-green-600 text-white hover:bg-green-700'
    },
    disabled: {
      true: 'opacity-50 cursor-not-allowed',
      false: ''
    }
  }
})

export const UploadExportPanel = ({ baseLayer, additionalLayers }: UploadExportPanelProps) => {
  const allLayers = baseLayer ? [baseLayer, ...additionalLayers] : additionalLayers
  const hasLayers = allLayers.length > 0

  const exportToPNG = useCallback(async () => {
    if (!hasLayers) return

    // Calculate canvas dimensions
    const canvasDimensions = allLayers.reduce(
      (acc, layer) => ({
        width: Math.max(acc.width, layer.position.x + layer.dimensions.width),
        height: Math.max(acc.height, layer.position.y + layer.dimensions.height)
      }),
      { width: 0, height: 0 }
    )

    // Create canvas element
    const canvas = document.createElement('canvas')
    canvas.width = canvasDimensions.width
    canvas.height = canvasDimensions.height
    const ctx = canvas.getContext('2d')

    if (!ctx) return

    // Sort layers by z-index
    const sortedLayers = [...allLayers].sort((a, b) => a.position.zIndex - b.position.zIndex)

    // Draw each layer
    for (const layer of sortedLayers) {
      if (!layer.visible) continue

      const img = new Image()
      await new Promise<void>((resolve) => {
        img.onload = () => {
          ctx.globalAlpha = layer.opacity
          ctx.drawImage(
            img,
            layer.position.x,
            layer.position.y,
            layer.dimensions.width,
            layer.dimensions.height
          )
          resolve()
        }
        img.src = layer.imageData
      })
    }

    // Download the image
    canvas.toBlob((blob) => {
      if (!blob) return
      
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `character-${Date.now()}.png`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    })
  }, [allLayers, hasLayers])

  const exportToJSON = useCallback(() => {
    if (!hasLayers) return

    const jsonData = exportLayerStack(allLayers)
    const blob = new Blob([jsonData], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `character-layers-${Date.now()}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [allLayers, hasLayers])

  const exportToGodot = useCallback(() => {
    if (!hasLayers) return

    const godotResource = `[gd_resource type="Resource" format=3]

[resource]
layers = [
${allLayers.map((layer, index) => `  {
    "id": "${layer.id}",
    "name": "${layer.name}",
    "position": Vector2(${layer.position.x}, ${layer.position.y}),
    "z_index": ${layer.position.zIndex},
    "opacity": ${layer.opacity},
    "visible": ${layer.visible},
    "dimensions": Vector2(${layer.dimensions.width}, ${layer.dimensions.height}),
    "is_base": ${layer.isBase || false}
  }${index < allLayers.length - 1 ? ',' : ''}`).join('\n')}
]
created_at = "${new Date().toISOString()}"
version = "1.0"
`

    const blob = new Blob([godotResource], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    
    const a = document.createElement('a')
    a.href = url
    a.download = `character-layers-${Date.now()}.tres`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [allLayers, hasLayers])

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Export Character</h3>
      
      {!hasLayers ? (
        <p className="text-sm text-gray-500">Upload layers to enable export options</p>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-gray-600">
            Export your character with {allLayers.length} layer{allLayers.length !== 1 ? 's' : ''}
          </p>
          
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={exportToPNG}
              className={exportButton({ variant: 'primary', disabled: !hasLayers })}
              disabled={!hasLayers}
            >
              <span>📷</span>
              <span>Export as PNG</span>
            </button>
            
            <button
              onClick={exportToJSON}
              className={exportButton({ variant: 'secondary', disabled: !hasLayers })}
              disabled={!hasLayers}
            >
              <span>📄</span>
              <span>Export Layer Data (JSON)</span>
            </button>
            
            <button
              onClick={exportToGodot}
              className={exportButton({ variant: 'success', disabled: !hasLayers })}
              disabled={!hasLayers}
            >
              <span>🎮</span>
              <span>Export for Godot (.tres)</span>
            </button>
          </div>
          
          <div className="text-xs text-gray-500 space-y-1">
            <p>• PNG: Flattened image ready for use</p>
            <p>• JSON: Layer data without images (for backup)</p>
            <p>• Godot: Resource file with layer positioning data</p>
          </div>
        </div>
      )}
    </div>
  )
} 