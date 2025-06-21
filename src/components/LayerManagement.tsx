import { useCallback, useState } from 'react'
import { tv } from 'tailwind-variants'
import type { UploadedLayer } from '../types/sprite'

type LayerManagementProps = {
  baseLayer: UploadedLayer | null
  additionalLayers: UploadedLayer[]
  selectedLayerId: string | null
  onLayerUpdate: (layerId: string, updates: Partial<UploadedLayer>) => void
  onLayerDelete: (layerId: string) => void
  onLayerReorder: (layerId: string, direction: 'up' | 'down') => void
}

const layerItem = tv({
  base: 'p-3 border border-gray-200 rounded-lg transition-all duration-200',
  variants: {
    selected: {
      true: 'border-blue-500 bg-blue-50',
      false: 'hover:border-gray-300 hover:bg-gray-50'
    },
    isBase: {
      true: 'border-green-300 bg-green-50',
      false: ''
    }
  }
})

const controlButton = tv({
  base: 'p-1 rounded text-xs transition-all duration-200',
  variants: {
    variant: {
      primary: 'bg-blue-100 text-blue-700 hover:bg-blue-200',
      danger: 'bg-red-100 text-red-700 hover:bg-red-200',
      secondary: 'bg-gray-100 text-gray-700 hover:bg-gray-200'
    },
    disabled: {
      true: 'opacity-50 cursor-not-allowed',
      false: 'cursor-pointer'
    }
  }
})

export const LayerManagement = ({
  baseLayer,
  additionalLayers,
  selectedLayerId,
  onLayerUpdate,
  onLayerDelete,
  onLayerReorder
}: LayerManagementProps) => {
  const allLayers = baseLayer ? [baseLayer, ...additionalLayers] : additionalLayers
  const sortedLayers = [...allLayers].sort((a, b) => b.position.zIndex - a.position.zIndex)

  const handleOpacityChange = useCallback((layerId: string, opacity: number) => {
    onLayerUpdate(layerId, { opacity })
  }, [onLayerUpdate])

  const handleVisibilityToggle = useCallback((layerId: string, visible: boolean) => {
    onLayerUpdate(layerId, { visible })
  }, [onLayerUpdate])

  const handleNameChange = useCallback((layerId: string, name: string) => {
    onLayerUpdate(layerId, { name })
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

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-800">Layer Management</h3>
      
      {allLayers.length === 0 ? (
        <p className="text-sm text-gray-500">No layers uploaded yet</p>
      ) : (
        <div className="space-y-2">
          {sortedLayers.map((layer) => (
            <div
              key={layer.id}
              className={layerItem({ 
                selected: selectedLayerId === layer.id, 
                isBase: layer.isBase 
              })}
            >
              <div className="space-y-3">
                {/* Layer Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="w-8 h-8 bg-white border border-gray-300 rounded overflow-hidden">
                      <img
                        src={layer.imageData}
                        alt={layer.name}
                        className="w-full h-full object-contain"
                        style={{ imageRendering: 'pixelated' }}
                      />
                    </div>
                    <input
                      type="text"
                      value={layer.name}
                      onChange={(e) => handleNameChange(layer.id, e.target.value)}
                      className="text-sm font-medium bg-transparent border-none outline-none focus:bg-white focus:border focus:border-gray-300 focus:rounded px-1"
                      disabled={layer.isBase}
                    />
                    {layer.isBase && (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                        BASE
                      </span>
                    )}
                  </div>
                  
                  {!layer.isBase && (
                    <div className="flex items-center space-x-1">
                      <button
                        onClick={() => onLayerReorder(layer.id, 'up')}
                        className={controlButton({ 
                          variant: 'secondary', 
                          disabled: !canMoveUp(layer.id) 
                        })}
                        disabled={!canMoveUp(layer.id)}
                        title="Move up"
                      >
                        ↑
                      </button>
                      <button
                        onClick={() => onLayerReorder(layer.id, 'down')}
                        className={controlButton({ 
                          variant: 'secondary', 
                          disabled: !canMoveDown(layer.id) 
                        })}
                        disabled={!canMoveDown(layer.id)}
                        title="Move down"
                      >
                        ↓
                      </button>
                      <button
                        onClick={() => onLayerDelete(layer.id)}
                        className={controlButton({ variant: 'danger' })}
                        title="Delete layer"
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>

                {/* Layer Controls */}
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="text-gray-600">Opacity</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={layer.opacity}
                        onChange={(e) => handleOpacityChange(layer.id, parseFloat(e.target.value))}
                        className="flex-1 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="w-8 text-right">{Math.round(layer.opacity * 100)}%</span>
                    </div>
                  </div>
                  
                  <div className="space-y-1">
                    <label className="text-gray-600">Visibility</label>
                    <button
                      onClick={() => handleVisibilityToggle(layer.id, !layer.visible)}
                      className={`w-full py-1 px-2 rounded text-xs font-medium transition-all duration-200 ${
                        layer.visible
                          ? 'bg-green-100 text-green-700 hover:bg-green-200'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {layer.visible ? '👁️ Visible' : '👁️‍🗨️ Hidden'}
                    </button>
                  </div>
                </div>

                {/* Layer Info */}
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{layer.dimensions.width} × {layer.dimensions.height}px</span>
                  <span>({layer.position.x}, {layer.position.y}) z:{layer.position.zIndex}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      <div className="text-xs text-gray-500 space-y-1">
        <p>• Click layer names to edit them</p>
        <p>• Use ↑↓ buttons to reorder layers</p>
        <p>• Base layer cannot be deleted or reordered</p>
      </div>
    </div>
  )
} 