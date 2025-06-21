import { tv } from 'tailwind-variants'
import type { SelectedLayers } from '../App'
import { ASSET_CATEGORIES, type AssetCategory } from '../utils/assetLoader'
import { exportSpriteAsJSON, exportGodotResource } from '../utils/exportUtils'

type ExportPanelProps = {
  selectedLayers: SelectedLayers
}

const exportButton = tv({
  base: 'px-4 py-2 rounded-lg font-medium transition-all duration-200 text-sm',
  variants: {
    variant: {
      primary: 'bg-blue-600 text-white hover:bg-blue-700 disabled:bg-gray-300 disabled:text-gray-500',
      secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300 disabled:bg-gray-100 disabled:text-gray-400',
      json: 'bg-green-600 text-white hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500',
      godot: 'bg-purple-600 text-white hover:bg-purple-700 disabled:bg-gray-300 disabled:text-gray-500'
    }
  }
})

export const ExportPanel = ({ selectedLayers }: ExportPanelProps) => {
  const hasAnyLayer = Object.values(selectedLayers).some(layer => layer !== null)

  const getCanvas = (): HTMLCanvasElement | null => {
    return document.querySelector('canvas')
  }

  const exportAsImage = () => {
    const canvas = getCanvas()
    if (!canvas) {
      alert('No sprite to export!')
      return
    }

    try {
      const link = document.createElement('a')
      link.download = `character-sprite-${Date.now()}.png`
      link.href = canvas.toDataURL('image/png')
      link.click()
    } catch (error) {
      console.error('Failed to export image:', error)
      alert('Failed to export image. Please try again.')
    }
  }

  const exportAsJSON = () => {
    const canvas = getCanvas()
    if (!hasAnyLayer) {
      alert('No layers selected to export!')
      return
    }

    try {
      exportSpriteAsJSON(selectedLayers, canvas || undefined)
    } catch (error) {
      console.error('Failed to export JSON:', error)
      alert('Failed to export JSON. Please try again.')
    }
  }

  const exportAsGodotResource = () => {
    const canvas = getCanvas()
    if (!hasAnyLayer) {
      alert('No layers selected to export!')
      return
    }

    try {
      exportGodotResource(selectedLayers, canvas || undefined)
    } catch (error) {
      console.error('Failed to export Godot resource:', error)
      alert('Failed to export Godot resource. Please try again.')
    }
  }

  const copyToClipboard = async () => {
    const canvas = getCanvas()
    if (!canvas) {
      alert('No sprite to copy!')
      return
    }

    try {
      canvas.toBlob(async (blob) => {
        if (!blob) return
        
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob })
          ])
          alert('Sprite copied to clipboard!')
        } catch (error) {
          console.error('Failed to copy to clipboard:', error)
          alert('Failed to copy to clipboard. Your browser may not support this feature.')
        }
      })
    } catch (error) {
      console.error('Failed to copy image:', error)
      alert('Failed to copy image. Please try again.')
    }
  }

  const getSelectedLayersInfo = () => {
    const selectedCount = Object.values(selectedLayers).filter(layer => layer !== null).length
    const totalLayers = Object.keys(selectedLayers).length
    return `${selectedCount}/${totalLayers} layers selected`
  }

  return (
    <div className="mt-6 space-y-4">
      <div className="text-sm text-gray-600 text-center">
        {getSelectedLayersInfo()}
      </div>
      
      <div className="space-y-2">
        <div className="text-xs font-medium text-gray-700 mb-2">Export Options:</div>
        
        <button
          onClick={exportAsImage}
          disabled={!hasAnyLayer}
          className={exportButton({ variant: 'primary' })}
        >
          📸 Download PNG
        </button>
        
        <button
          onClick={exportAsJSON}
          disabled={!hasAnyLayer}
          className={exportButton({ variant: 'json' })}
        >
          📄 Export JSON
        </button>
        
        <button
          onClick={exportAsGodotResource}
          disabled={!hasAnyLayer}
          className={exportButton({ variant: 'godot' })}
        >
          🎮 Export Godot Resource
        </button>
        
        <button
          onClick={copyToClipboard}
          disabled={!hasAnyLayer}
          className={exportButton({ variant: 'secondary' })}
        >
          📋 Copy to Clipboard
        </button>
      </div>

      {hasAnyLayer && (
        <div className="text-xs text-gray-500 space-y-1 border-t pt-3">
          <div className="font-medium">Layer Stack (bottom to top):</div>
          {Object.entries(selectedLayers).map(([layerType, assetName]) => 
            assetName && (
              <div key={layerType} className="flex justify-between items-center">
                <span className="flex items-center">
                  <span className="w-2 h-2 bg-blue-400 rounded-full mr-2"></span>
                  {ASSET_CATEGORIES[layerType as AssetCategory]}:
                </span>
                <span className="text-gray-600 truncate ml-2 text-right">
                  {assetName.replace(/\.(png|jpg|jpeg)$/i, '')}
                </span>
              </div>
            )
          )}
        </div>
      )}
    </div>
  )
} 