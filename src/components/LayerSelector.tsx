import { useState, useEffect } from 'react'
import { tv } from 'tailwind-variants'
import type { SelectedLayers } from '../App'
import { loadAssets, ASSET_CATEGORIES, type AssetCategory, type AssetInfo, getAssetPath } from '../utils/assetLoader'

type LayerSelectorProps = {
  selectedLayers: SelectedLayers
  onLayerChange: (layerType: AssetCategory, assetName: string | null) => void
}

const layerButton = tv({
  base: 'px-4 py-2 rounded-lg border-2 transition-all duration-200 text-sm font-medium',
  variants: {
    active: {
      true: 'border-blue-500 bg-blue-50 text-blue-700',
      false: 'border-gray-300 bg-white text-gray-700 hover:border-gray-400 hover:bg-gray-50'
    }
  }
})

const assetButton = tv({
  base: 'p-2 rounded-lg border-2 transition-all duration-200 text-xs text-center min-h-[80px] flex flex-col items-center justify-center',
  variants: {
    selected: {
      true: 'border-green-500 bg-green-50 text-green-700',
      false: 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:bg-gray-50'
    }
  }
})

export const LayerSelector = ({ selectedLayers, onLayerChange }: LayerSelectorProps) => {
  const [activeLayer, setActiveLayer] = useState<AssetCategory>('characters')
  const [assets, setAssets] = useState<Record<AssetCategory, AssetInfo[]>>({
    characters: [],
    eyes: [],
    clothes: [],
    hair: [],
    acc: []
  })

  useEffect(() => {
    const loadedAssets = loadAssets()
    setAssets(loadedAssets)
  }, [])

  const handleAssetSelect = (assetName: string) => {
    const currentSelection = selectedLayers[activeLayer]
    const newSelection = currentSelection === assetName ? null : assetName
    onLayerChange(activeLayer, newSelection)
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2">
        {(Object.keys(ASSET_CATEGORIES) as AssetCategory[]).map((layerType) => (
          <button
            key={layerType}
            onClick={() => setActiveLayer(layerType)}
            className={layerButton({ active: activeLayer === layerType })}
          >
            {ASSET_CATEGORIES[layerType]}
          </button>
        ))}
      </div>

      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">
          {ASSET_CATEGORIES[activeLayer]}
        </h3>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          <button
            onClick={() => onLayerChange(activeLayer, null)}
            className={assetButton({ selected: selectedLayers[activeLayer] === null })}
          >
            <div className="w-12 h-12 bg-gray-200 rounded border-2 border-dashed border-gray-400 flex items-center justify-center mb-1">
              <span className="text-gray-500 text-sm">✕</span>
            </div>
            <span>None</span>
          </button>
          
          {assets[activeLayer].map((asset) => (
            <button
              key={asset.filename}
              onClick={() => handleAssetSelect(asset.filename)}
              className={assetButton({ selected: selectedLayers[activeLayer] === asset.filename })}
              title={asset.displayName}
            >
              <div className="w-12 h-12 bg-gray-100 rounded mb-1 flex items-center justify-center overflow-hidden">
                <img 
                  src={getAssetPath(asset.category, asset.filename)}
                  alt={asset.displayName}
                  className="w-full h-full object-contain"
                  style={{ imageRendering: 'pixelated' }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    target.style.display = 'none'
                    const parent = target.parentElement
                    if (parent) {
                      parent.innerHTML = '<span class="text-xs text-gray-600">IMG</span>'
                    }
                  }}
                />
              </div>
              <span className="leading-tight text-center">{asset.displayName}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
} 