import { useCallback, useState } from 'react'
import type { UploadedLayer } from '../types/sprite'

type LayerManagementProps = {
  baseLayer: UploadedLayer | null
  additionalLayers: UploadedLayer[]
  selectedLayerId: string | null
  onLayerUpdate: (layerId: string, updates: Partial<UploadedLayer>) => void
  onLayerDelete: (layerId: string) => void
  onLayerReorder: (layerId: string, direction: 'up' | 'down') => void
}



type LayerPreviewModalProps = {
  layer: UploadedLayer
  onClose: () => void
}

const LayerPreviewModal = ({ layer, onClose }: LayerPreviewModalProps) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg p-6 max-w-2xl max-h-[80vh] overflow-auto" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">{layer.name}</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-xl font-bold"
          >
            ×
          </button>
        </div>
        <div className="text-center">
          <img
            src={layer.imageData}
            alt={layer.name}
            className="max-w-full max-h-96 mx-auto"
            style={{ imageRendering: 'pixelated' }}
          />
          <div className="mt-4 text-sm text-gray-600 space-y-1">
            <p>Dimensions: {layer.dimensions.width} × {layer.dimensions.height}px</p>
            <p>Position: ({layer.position.x}, {layer.position.y})</p>
            <p>Z-Index: {layer.position.zIndex}</p>
            <p>Opacity: {Math.round(layer.opacity * 100)}%</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export const LayerManagement = ({
  baseLayer,
  additionalLayers,
  selectedLayerId,
  onLayerUpdate,
  onLayerDelete,
  onLayerReorder
}: LayerManagementProps) => {
  const [previewLayer, setPreviewLayer] = useState<UploadedLayer | null>(null)
  
  const allLayers = baseLayer ? [baseLayer, ...additionalLayers] : additionalLayers
  const sortedLayers = [...allLayers].sort((a, b) => b.position.zIndex - a.position.zIndex)

  const handleVisibilityToggle = useCallback((layerId: string, visible: boolean) => {
    onLayerUpdate(layerId, { visible })
  }, [onLayerUpdate])

  const getLayerIndex = (layerId: string) => {
    return sortedLayers.findIndex(layer => layer.id === layerId)
  }

  const canMoveUp = (layerId: string) => {
    const index = getLayerIndex(layerId)
    return index > 0 && !sortedLayers[index].isBase
  }

  const canMoveDown = (layerId: string) => {
    const index = getLayerIndex(layerId)
    return index < sortedLayers.length - 1 && !sortedLayers[index].isBase
  }

  // Show panel when there are layers, or always show for now to test
  if (allLayers.length === 0) {
    // For testing - always show the panel
    // return null
  }

  return (
    <>
      <div className="fixed top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-4 z-40 min-w-[200px]">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-gray-800">Layers ({allLayers.length})</h3>
          <div className="text-xs text-gray-500">Top to Bottom</div>
        </div>
        
        <div className="space-y-2">
          {allLayers.length === 0 ? (
            <div className="text-xs text-gray-500 text-center py-4 border-2 border-dashed border-gray-300 rounded-lg">
              <div className="mb-2">📁</div>
              <div>No layers uploaded yet</div>
              <div className="text-xs mt-1">Upload a base layer to start</div>
            </div>
          ) : (
            sortedLayers.map((layer) => (
            <div
              key={layer.id}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-50"
            >
              {/* Layer Thumbnail */}
              <div className={`w-12 h-12 border-2 rounded-lg cursor-pointer transition-all duration-200 relative group ${
                selectedLayerId === layer.id 
                  ? 'border-blue-500 ring-2 ring-blue-200' 
                  : layer.isBase 
                    ? 'border-green-500 ring-2 ring-green-200'
                    : 'border-gray-300 hover:border-gray-400'
              }`}>
                <img
                  src={layer.imageData}
                  alt={layer.name}
                  className="w-full h-full object-contain rounded"
                  style={{ imageRendering: 'pixelated' }}
                />
                
                {/* Visibility indicator */}
                <div className="absolute -top-1 -left-1 w-3 h-3 rounded-full bg-white border">
                  <div 
                    className={`w-full h-full rounded-full ${
                      layer.visible ? 'bg-green-500' : 'bg-gray-400'
                    }`}
                  />
                </div>

                {/* Base layer indicator */}
                {layer.isBase && (
                  <div className="absolute -bottom-1 -left-1 w-4 h-3 bg-green-500 text-white text-xs flex items-center justify-center rounded text-[8px] font-bold">
                    B
                  </div>
                )}
              </div>

              {/* Layer Info */}
              <div className="flex-1 min-w-0">
                <div className="text-xs font-medium text-gray-800 truncate">
                  {layer.name}
                </div>
                <div className="text-xs text-gray-500">
                  {Math.round(layer.opacity * 100)}%
                </div>
              </div>

              {/* Controls */}
              <div className="flex flex-col space-y-1">
                {/* Move Up */}
                <button
                  onClick={() => onLayerReorder(layer.id, 'up')}
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-all duration-200 ${
                    !canMoveUp(layer.id)
                      ? 'opacity-50 cursor-not-allowed bg-gray-500 text-white'
                      : 'cursor-pointer bg-gray-500 text-white hover:bg-gray-600'
                  }`}
                  disabled={!canMoveUp(layer.id)}
                  title="Move up"
                >
                  ↑
                </button>
                
                {/* Move Down */}
                <button
                  onClick={() => onLayerReorder(layer.id, 'down')}
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-all duration-200 ${
                    !canMoveDown(layer.id)
                      ? 'opacity-50 cursor-not-allowed bg-gray-500 text-white'
                      : 'cursor-pointer bg-gray-500 text-white hover:bg-gray-600'
                  }`}
                  disabled={!canMoveDown(layer.id)}
                  title="Move down"
                >
                  ↓
                </button>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col space-y-1">
                {/* Magnifier */}
                <button
                  onClick={() => setPreviewLayer(layer)}
                  className="w-6 h-6 rounded flex items-center justify-center text-xs transition-all duration-200 cursor-pointer bg-blue-500 text-white hover:bg-blue-600"
                  title="Preview layer"
                >
                  🔍
                </button>
                
                {/* Visibility Toggle */}
                <button
                  onClick={() => handleVisibilityToggle(layer.id, !layer.visible)}
                  className={`w-6 h-6 rounded flex items-center justify-center text-xs transition-all duration-200 cursor-pointer ${
                    layer.visible 
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-500 text-white hover:bg-gray-600'
                  }`}
                  title={layer.visible ? 'Hide layer' : 'Show layer'}
                >
                  {layer.visible ? '👁️' : '🙈'}
                </button>
              </div>

              {/* Delete Button (only for non-base layers) */}
              {!layer.isBase && (
                <button
                  onClick={() => onLayerDelete(layer.id)}
                  className="w-6 h-6 rounded flex items-center justify-center text-xs transition-all duration-200 cursor-pointer bg-red-500 text-white hover:bg-red-600"
                  title="Delete layer"
                >
                  ✕
                </button>
              )}
            </div>
          ))
          )}
        </div>

        <div className="mt-3 pt-2 border-t border-gray-200 text-xs text-gray-500 space-y-1">
          <p>• Green dot = visible, Gray = hidden</p>
          <p>• B = Base layer (cannot be deleted)</p>
          <p>• 🔍 = Preview full layer</p>
        </div>
      </div>

      {/* Layer Preview Modal */}
      {previewLayer && (
        <LayerPreviewModal
          layer={previewLayer}
          onClose={() => setPreviewLayer(null)}
        />
      )}
    </>
  )
} 