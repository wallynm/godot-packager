import React, { useState } from 'react'
import UploadPanel from './components/UploadPanel'
import { DraggableCanvas } from './components/DraggableCanvas'
import UploadExportPanel from './components/UploadExportPanel'
import type { UploadedLayer, ExportConfig } from './types/sprite'

const App = () => {
  const [layers, setLayers] = useState<UploadedLayer[]>([])
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)
  const [exportConfig, setExportConfig] = useState<ExportConfig>({
    width: 800,
    height: 600,
    name: 'character'
  })

  const handleLayerUpdate = (layerId: string, updates: Partial<UploadedLayer>) => {
    setLayers(prev => prev.map(layer =>
      layer.id === layerId ? { ...layer, ...updates } : layer
    ))
  }

  const handleLayersChange = (newLayers: UploadedLayer[]) => {
    const previousLayerCount = layers.length
    const isFirstUpload = previousLayerCount === 0 && newLayers.length > 0
    
    if (isFirstUpload) {
      // Update export config with the first uploaded image dimensions
      const firstLayer = newLayers[0]
      setExportConfig(prev => ({
        ...prev,
        width: firstLayer.width,
        height: firstLayer.height
      }))
    }
    
    setLayers(newLayers)
  }

  const handleConfigChange = (config: { width: number; height: number; name: string }) => {
    setExportConfig(prev => ({
      ...prev,
      width: config.width,
      height: config.height,
      name: config.name
    }))
  }

  return (
    <div className="h-screen bg-gray-100" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', width: '100vw' }}>
      {/* Main Canvas Area */}
      <div className="relative min-w-0 w-full">
        <div className="h-full flex flex-col">
          <header className="bg-white border-b border-gray-200 px-6 py-4">
            <h1 className="text-2xl font-bold text-gray-900 mb-1">
              Character Creator
            </h1>
            <p className="text-gray-600 text-sm">
              Upload and arrange character layers to create your custom sprite
            </p>
          </header>
          
          <div className="flex-1 min-h-0">
            <DraggableCanvas
              layers={layers}
              selectedLayerId={selectedLayerId}
              exportConfig={exportConfig}
              onLayerUpdate={handleLayerUpdate}
              onLayerSelect={setSelectedLayerId}
            />
          </div>
        </div>
      </div>
      
      {/* Sidebar */}
      <div className="bg-white border-l border-gray-200 overflow-hidden" style={{ 
        width: '320px', 
        minWidth: '320px', 
        maxWidth: '320px',
        boxSizing: 'border-box'
      }}>
        <div className="h-full overflow-y-auto">
          <div className="p-4 space-y-6" style={{ width: '100%', maxWidth: '320px', boxSizing: 'border-box' }}>
            <UploadPanel
              layers={layers}
              onLayersChange={handleLayersChange}
            />
            
            <UploadExportPanel
              layers={layers}
              canvasSize={{ width: exportConfig.width, height: exportConfig.height }}
              onConfigChange={handleConfigChange}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
