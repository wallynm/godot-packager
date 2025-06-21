import { useCallback, useState } from 'react'
import { tv } from 'tailwind-variants'
import type { UploadedLayer } from '../types/sprite'
import { createLayerFromFile, calculateSuggestedPosition } from '../utils/uploadUtils'

type UploadPanelProps = {
  baseLayer: UploadedLayer | null
  additionalLayers: UploadedLayer[]
  onBaseLayerUpload: (layer: UploadedLayer) => void
  onAdditionalLayerUpload: (layer: UploadedLayer) => void
}

const uploadArea = tv({
  base: 'border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer',
  variants: {
    dragOver: {
      true: 'border-blue-500 bg-blue-50',
      false: 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
    },
    hasBase: {
      true: 'border-green-300 bg-green-50',
      false: ''
    }
  }
})



export const UploadPanel = ({ 
  baseLayer, 
  additionalLayers, 
  onBaseLayerUpload, 
  onAdditionalLayerUpload 
}: UploadPanelProps) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = useCallback(async (files: FileList, isBase: boolean = false) => {
    if (files.length === 0) return

    setIsUploading(true)
    setError(null)

    try {
      const file = files[0]
      
      if (isBase) {
        const layer = await createLayerFromFile(file, true)
        onBaseLayerUpload(layer)
      } else {
        // Calculate suggested position for additional layers
        const suggestedPosition = baseLayer 
          ? calculateSuggestedPosition(
              { width: 0, height: 0 }, // Will be calculated in createLayerFromFile
              baseLayer.dimensions,
              additionalLayers
            )
          : { x: 0, y: 0 }

        const layer = await createLayerFromFile(file, false, suggestedPosition)
        onAdditionalLayerUpload(layer)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file')
    } finally {
      setIsUploading(false)
    }
  }, [baseLayer, additionalLayers, onBaseLayerUpload, onAdditionalLayerUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    handleFileUpload(files, !baseLayer)
  }, [baseLayer, handleFileUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>, isBase: boolean = false) => {
    const files = e.target.files
    if (files) {
      handleFileUpload(files, isBase)
    }
    // Reset input value to allow re-uploading the same file
    e.target.value = ''
  }, [handleFileUpload])

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Upload Layers</h3>
        
        {!baseLayer ? (
          <div className="space-y-2">
            <p className="text-sm text-gray-600">First, upload a character base layer:</p>
            <div
              className={uploadArea({ dragOver: isDragOver, hasBase: false })}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => document.getElementById('base-file-input')?.click()}
            >
              <div className="space-y-2">
                <div className="text-4xl text-gray-400">📤</div>
                <p className="text-gray-600">
                  Drop your character base image here or click to browse
                </p>
                <p className="text-xs text-gray-500">
                  Supports PNG, JPG, GIF, WebP
                </p>
              </div>
              <input
                id="base-file-input"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileInput(e, true)}
                disabled={isUploading}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-white rounded border overflow-hidden">
                  <img 
                    src={baseLayer.imageData} 
                    alt={baseLayer.name}
                    className="w-full h-full object-contain"
                    style={{ imageRendering: 'pixelated' }}
                  />
                </div>
                <div>
                  <p className="font-medium text-green-800">{baseLayer.name}</p>
                  <p className="text-sm text-green-600">
                    {baseLayer.dimensions.width} × {baseLayer.dimensions.height}px
                  </p>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm text-gray-600">Add additional layers:</p>
              <div
                className={uploadArea({ dragOver: isDragOver, hasBase: true })}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => document.getElementById('layer-file-input')?.click()}
              >
                <div className="space-y-2">
                  <div className="text-4xl text-gray-400">🎨</div>
                  <p className="text-gray-600">
                    Drop additional layers here or click to browse
                  </p>
                  <p className="text-xs text-gray-500">
                    Layers will be positioned automatically, then you can drag to adjust
                  </p>
                </div>
                <input
                  id="layer-file-input"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => handleFileInput(e, false)}
                  disabled={isUploading}
                />
              </div>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {isUploading && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-600">Uploading...</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <h4 className="font-medium text-gray-800">Layer Stack ({additionalLayers.length + (baseLayer ? 1 : 0)})</h4>
        <div className="space-y-2 max-h-40 overflow-y-auto">
          {baseLayer && (
            <div className="flex items-center space-x-2 p-2 bg-green-50 border border-green-200 rounded text-sm">
              <span className="w-2 h-2 bg-green-500 rounded-full"></span>
              <span className="font-medium">{baseLayer.name}</span>
              <span className="text-gray-500">(Base)</span>
            </div>
          )}
          {additionalLayers
            .sort((a, b) => b.position.zIndex - a.position.zIndex)
            .map((layer) => (
              <div key={layer.id} className="flex items-center space-x-2 p-2 bg-gray-50 border border-gray-200 rounded text-sm">
                <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
                <span>{layer.name}</span>
                <span className="text-gray-500">
                  ({layer.position.x}, {layer.position.y})
                </span>
              </div>
            ))}
        </div>
      </div>
    </div>
  )
} 