import { useState } from 'react'
import { SpriteCanvas } from './components/SpriteCanvas'
import { LayerSelector } from './components/LayerSelector'
import { ExportPanel } from './components/ExportPanel'
import type { AssetCategory } from './utils/assetLoader'

export type SelectedLayers = {
  characters: string | null
  eyes: string | null
  clothes: string | null
  hair: string | null
  acc: string | null
}

const App = () => {
  const [selectedLayers, setSelectedLayers] = useState<SelectedLayers>({
    characters: null,
    eyes: null,
    clothes: null,
    hair: null,
    acc: null
  })

  const updateLayer = (layerType: AssetCategory, assetName: string | null) => {
    setSelectedLayers(prev => ({
      ...prev,
      [layerType]: assetName
    }))
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-4xl font-bold text-center mb-8 text-gray-800">
          Character Sprite Builder
        </h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Canvas</h2>
              <SpriteCanvas selectedLayers={selectedLayers} />
              <ExportPanel selectedLayers={selectedLayers} />
            </div>
          </div>
          
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-semibold mb-4">Layer Selection</h2>
              <LayerSelector 
                selectedLayers={selectedLayers}
                onLayerChange={updateLayer}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
