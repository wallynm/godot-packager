import { useState, useCallback } from 'react'
import { UploadPanel } from './components/UploadPanel'
import { DraggableCanvas } from './components/DraggableCanvas'
import { LayerManagement } from './components/LayerManagement'
import { UploadExportPanel } from './components/UploadExportPanel'
import type { UploadedLayer } from './types/sprite'
import { calculateSuggestedPosition } from './utils/uploadUtils'

const App = () => {
  const [baseLayer, setBaseLayer] = useState<UploadedLayer | null>(null)
  const [additionalLayers, setAdditionalLayers] = useState<UploadedLayer[]>([])
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)

  const handleBaseLayerUpload = useCallback((layer: UploadedLayer) => {
    setBaseLayer(layer)
    setSelectedLayerId(layer.id)
  }, [])

  const handleAdditionalLayerUpload = useCallback((layer: UploadedLayer) => {
    // Recalculate position with actual dimensions
    if (baseLayer) {
      const suggestedPosition = calculateSuggestedPosition(
        layer.dimensions,
        baseLayer.dimensions,
        additionalLayers
      )
      layer.position.x = suggestedPosition.x
      layer.position.y = suggestedPosition.y
    }

    setAdditionalLayers(prev => [...prev, layer])
    setSelectedLayerId(layer.id)
  }, [baseLayer, additionalLayers])

  const handleLayerPositionChange = useCallback((layerId: string, x: number, y: number) => {
    if (baseLayer?.id === layerId) {
      setBaseLayer(prev => prev ? {
        ...prev,
        position: { ...prev.position, x, y }
      } : null)
    } else {
      setAdditionalLayers(prev => prev.map(layer =>
        layer.id === layerId
          ? { ...layer, position: { ...layer.position, x, y } }
          : layer
      ))
    }
  }, [baseLayer?.id])

  const handleLayerUpdate = useCallback((layerId: string, updates: Partial<UploadedLayer>) => {
    if (baseLayer?.id === layerId) {
      setBaseLayer(prev => prev ? { ...prev, ...updates } : null)
    } else {
      setAdditionalLayers(prev => prev.map(layer =>
        layer.id === layerId ? { ...layer, ...updates } : layer
      ))
    }
  }, [baseLayer?.id])

  const handleLayerDelete = useCallback((layerId: string) => {
    setAdditionalLayers(prev => prev.filter(layer => layer.id !== layerId))
    if (selectedLayerId === layerId) {
      setSelectedLayerId(null)
    }
  }, [selectedLayerId])

  const handleLayerReorder = useCallback((layerId: string, direction: 'up' | 'down') => {
    const layer = additionalLayers.find(l => l.id === layerId)
    if (!layer) return

    const allLayers = baseLayer ? [baseLayer, ...additionalLayers] : additionalLayers
    const sortedLayers = [...allLayers].sort((a, b) => a.position.zIndex - b.position.zIndex)
    const currentIndex = sortedLayers.findIndex(l => l.id === layerId)
    
    if (currentIndex === -1) return

    let newZIndex: number
    if (direction === 'up' && currentIndex < sortedLayers.length - 1) {
      newZIndex = sortedLayers[currentIndex + 1].position.zIndex + 1
    } else if (direction === 'down' && currentIndex > 0) {
      newZIndex = sortedLayers[currentIndex - 1].position.zIndex - 1
    } else {
      return
    }

    setAdditionalLayers(prev => prev.map(l =>
      l.id === layerId
        ? { ...l, position: { ...l.position, zIndex: newZIndex } }
        : l
    ))
  }, [additionalLayers, baseLayer])

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Character Layer Builder
        </h1>
        
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Canvas Section */}
          <div className="xl:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Canvas</h2>
              <DraggableCanvas
                baseLayer={baseLayer}
                additionalLayers={additionalLayers}
                onLayerPositionChange={handleLayerPositionChange}
                onLayerSelect={setSelectedLayerId}
                selectedLayerId={selectedLayerId}
              />
            </div>
          </div>
          
          {/* Control Panels */}
          <div className="space-y-6">
            {/* Upload Panel */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <UploadPanel
                baseLayer={baseLayer}
                additionalLayers={additionalLayers}
                onBaseLayerUpload={handleBaseLayerUpload}
                onAdditionalLayerUpload={handleAdditionalLayerUpload}
              />
            </div>

            {/* Export Panel */}
            <div className="bg-white rounded-lg shadow-lg p-6">
              <UploadExportPanel
                baseLayer={baseLayer}
                additionalLayers={additionalLayers}
              />
            </div>
          </div>
        </div>

        {/* Floating Layer Management Panel */}
        <LayerManagement
          baseLayer={baseLayer}
          additionalLayers={additionalLayers}
          selectedLayerId={selectedLayerId}
          onLayerUpdate={handleLayerUpdate}
          onLayerDelete={handleLayerDelete}
          onLayerReorder={handleLayerReorder}
        />
      </div>
    </div>
  )
}

export default App
