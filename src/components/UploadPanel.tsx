import React, { useCallback, useState } from 'react'
import { tv } from 'tailwind-variants'
import { createLayerFromFile } from '../utils/uploadUtils'
import type { UploadedLayer } from '../types/sprite'

const uploadPanel = tv({
  slots: {
    container: 'bg-white rounded-lg shadow-sm border overflow-hidden w-full',
    title: 'text-lg font-semibold mb-4',
    section: 'mb-6 w-full overflow-hidden',
    sectionTitle: 'text-sm font-medium text-gray-700 mb-2',
    dropZone: 'border-2 border-dashed rounded-lg p-8 text-center transition-colors',
    dropZoneActive: 'border-blue-500 bg-blue-50',
    dropZoneInactive: 'border-gray-300 hover:border-gray-400',
    dropZoneText: 'text-gray-600 mb-2',
    dropZoneSubtext: 'text-sm text-gray-500',
    fileInput: 'hidden',
    button: 'px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors',
    layersList: 'space-y-2 w-full overflow-hidden',
    layerItem: 'flex items-center justify-between p-3 bg-gray-50 rounded-md min-w-0 w-full overflow-hidden',
    layerInfo: 'flex items-center space-x-3 min-w-0 flex-1 overflow-hidden',
    layerPreviewContainer: 'w-12 h-12 border rounded bg-gray-100 flex-shrink-0 cursor-pointer hover:opacity-80 overflow-hidden relative',
    layerPreview: 'w-full h-full object-cover absolute inset-0',
    layerName: 'font-medium truncate',
    layerSize: 'text-sm text-gray-500 truncate',
    layerOrder: 'text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full font-medium flex-shrink-0',
    layerControls: 'flex items-center space-x-2',
    layerButton: 'px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded',
    magnifierButton: 'px-2 py-1 text-xs bg-blue-100 hover:bg-blue-200 text-blue-700 rounded',
    removeButton: 'text-red-600 hover:text-red-800 text-sm',
    modal: 'fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50',
    modalContent: 'max-w-4xl max-h-4xl bg-white rounded-lg p-4 relative',
    modalImage: 'max-w-full max-h-full object-contain',
    modalClose: 'absolute top-2 right-2 text-gray-500 hover:text-gray-700 text-2xl cursor-pointer',
    modalInfo: 'text-center text-gray-600 mt-2'
  }
})

type UploadPanelProps = {
  layers: UploadedLayer[]
  onLayersChange: (layers: UploadedLayer[]) => void
}

const UploadPanel = ({ layers, onLayersChange }: UploadPanelProps) => {
  const styles = uploadPanel()
  const [dragActive, setDragActive] = React.useState(false)
  const [selectedImageForModal, setSelectedImageForModal] = useState<UploadedLayer | null>(null)
  
  const baseLayers = layers.filter(layer => layer.isBase)
  const additionalLayers = layers.filter(layer => !layer.isBase)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(async (e: React.DragEvent, isBase: boolean = false) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    const files = Array.from(e.dataTransfer.files)
    const imageFiles = files.filter(file => file.type.startsWith('image/'))
    
    if (imageFiles.length === 0) return

    try {
      const newLayers = await Promise.all(
        imageFiles.map(file => createLayerFromFile(file, isBase, layers))
      )
      
      onLayersChange([...layers, ...newLayers])
    } catch (error) {
      console.error('Error processing uploaded files:', error)
    }
  }, [layers, onLayersChange])

  const handleFileInput = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, isBase: boolean = false) => {
    const files = Array.from(e.target.files || [])
    if (files.length === 0) return

    try {
      const newLayers = await Promise.all(
        files.map(file => createLayerFromFile(file, isBase, layers))
      )
      
      onLayersChange([...layers, ...newLayers])
    } catch (error) {
      console.error('Error processing uploaded files:', error)
    }
    
    e.target.value = ''
  }, [layers, onLayersChange])

  const removeLayer = useCallback((layerId: string) => {
    onLayersChange(layers.filter(layer => layer.id !== layerId))
  }, [layers, onLayersChange])

  const moveLayerUp = useCallback((layerId: string) => {
    const layer = layers.find(l => l.id === layerId)
    if (!layer) return

    const maxZIndex = Math.max(...layers.map(l => l.position.zIndex))
    onLayersChange(layers.map(l => 
      l.id === layerId 
        ? { ...l, position: { ...l.position, zIndex: maxZIndex + 1 } }
        : l
    ))
  }, [layers, onLayersChange])

  const moveLayerDown = useCallback((layerId: string) => {
    const layer = layers.find(l => l.id === layerId)
    if (!layer) return

    const minZIndex = Math.min(...layers.map(l => l.position.zIndex))
    onLayersChange(layers.map(l => 
      l.id === layerId 
        ? { ...l, position: { ...l.position, zIndex: Math.max(0, minZIndex - 1) } }
        : l
    ))
  }, [layers, onLayersChange])

  const renderDropZone = (isBase: boolean, title: string, description: string) => (
    <div className={styles.section()}>
      <h3 className={styles.sectionTitle()}>{title}</h3>
      <div
        className={`${styles.dropZone()} ${dragActive ? styles.dropZoneActive() : styles.dropZoneInactive()}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={(e) => handleDrop(e, isBase)}
      >
        <div className={styles.dropZoneText()}>
          Drop images here or click to select
        </div>
        <div className={styles.dropZoneSubtext()}>
          {description}
        </div>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => handleFileInput(e, isBase)}
          className={styles.fileInput()}
          id={isBase ? 'base-upload' : 'layer-upload'}
        />
        <label htmlFor={isBase ? 'base-upload' : 'layer-upload'} className={styles.button()}>
          Select Files
        </label>
      </div>
    </div>
  )

  const renderLayersList = (layersList: UploadedLayer[], title: string) => {
    if (layersList.length === 0) return null

    // Sort layers by zIndex in descending order (top layers first in UI)
    const sortedLayers = [...layersList].sort((a, b) => b.position.zIndex - a.position.zIndex)

    return (
      <div className={styles.section()}>
        <h3 className={styles.sectionTitle()}>{title}</h3>
        <div className={styles.layersList()}>
          {sortedLayers.map((layer, index) => (
            <div key={layer.id} className={styles.layerItem()}>
              <div className={styles.layerInfo()}>
                <div 
                  className={styles.layerPreviewContainer()}
                  onClick={() => setSelectedImageForModal(layer)}
                  title="Click to view full image"
                >
                  <img
                    src={layer.imageData}
                    alt={layer.name}
                    className={styles.layerPreview()}
                  />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden" style={{ maxWidth: '200px' }}>
                  <div className="flex items-center gap-2">
                    <div className={styles.layerName()}>{layer.name}</div>
                    <div className={styles.layerOrder()} title={`Layer order: ${index + 1} of ${sortedLayers.length} (zIndex: ${layer.position.zIndex})`}>
                      #{index + 1}
                    </div>
                  </div>
                  <div className={styles.layerSize()}>
                    {layer.width} × {layer.height}px
                  </div>
                </div>
              </div>
              <div className={styles.layerControls()}>
                <button
                  onClick={() => setSelectedImageForModal(layer)}
                  className={styles.magnifierButton()}
                  title="View full image"
                >
                  🔍
                </button>
                <button
                  onClick={() => moveLayerUp(layer.id)}
                  className={styles.layerButton()}
                  title="Move layer up"
                >
                  ↑
                </button>
                <button
                  onClick={() => moveLayerDown(layer.id)}
                  className={styles.layerButton()}
                  title="Move layer down"
                >
                  ↓
                </button>
                <button
                  onClick={() => removeLayer(layer.id)}
                  className={styles.removeButton()}
                >
                  ×
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={styles.container()}>
        <div className="p-4" style={{ maxWidth: '100%', width: '100%', boxSizing: 'border-box' }}>
          <h2 className={styles.title()}>Upload Layers</h2>
        
          {renderDropZone(true, 'Base Character', 'Upload your main character sprite')}
          {renderLayersList(baseLayers, 'Base Layers')}
          
          {renderDropZone(false, 'Additional Layers', 'Upload hair, clothes, accessories, etc.')}
          {renderLayersList(additionalLayers, 'Additional Layers')}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImageForModal && (
        <div 
          className={styles.modal()}
          onClick={() => setSelectedImageForModal(null)}
        >
          <div 
            className={styles.modalContent()}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className={styles.modalClose()}
              onClick={() => setSelectedImageForModal(null)}
            >
              ×
            </button>
            <img
              src={selectedImageForModal.imageData}
              alt={selectedImageForModal.name}
              className={styles.modalImage()}
            />
            <div className={styles.modalInfo()}>
              <div className="font-medium">{selectedImageForModal.name}</div>
              <div className="text-sm">
                {selectedImageForModal.width} × {selectedImageForModal.height}px
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default UploadPanel 