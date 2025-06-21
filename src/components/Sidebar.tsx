import { useCallback, useState } from 'react'
import { tv } from 'tailwind-variants'
import type { UploadedLayer, ExportConfig } from '../types/sprite'
import { createLayerFromFile } from '../utils/uploadUtils'

type SidebarProps = {
  layers: UploadedLayer[]
  exportConfig: ExportConfig
  onLayerUpload: (layer: UploadedLayer) => void
  onExportConfigChange: (config: ExportConfig) => void
  onExport: (format: 'png' | 'json' | 'godot') => void
}

const uploadArea = tv({
  base: 'border-2 border-dashed rounded-lg p-6 text-center transition-all duration-200 cursor-pointer',
  variants: {
    dragOver: {
      true: 'border-blue-500 bg-blue-50',
      false: 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
    }
  }
})

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

export const Sidebar = ({ 
  layers, 
  exportConfig, 
  onLayerUpload, 
  onExportConfigChange, 
  onExport 
}: SidebarProps) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = useCallback(async (files: FileList) => {
    if (files.length === 0) return

    setIsUploading(true)
    setError(null)

    try {
      const file = files[0]
      
      // Center position based on export config
      const canvasCenter = {
        x: exportConfig.width / 2,
        y: exportConfig.height / 2
      }

      const layer = await createLayerFromFile(file, canvasCenter)
      onLayerUpload(layer)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload file')
    } finally {
      setIsUploading(false)
    }
  }, [exportConfig, onLayerUpload])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    
    const files = e.dataTransfer.files
    handleFileUpload(files)
  }, [handleFileUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files) {
      handleFileUpload(files)
    }
    e.target.value = ''
  }, [handleFileUpload])

  return (
    <div className="p-6 space-y-6">
      {/* Upload Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Upload Layers</h3>
        
        <div
          className={uploadArea({ dragOver: isDragOver })}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <div className="space-y-2">
            <div className="text-4xl text-gray-400">📤</div>
            <p className="text-gray-600">
              Drop your layer image here or click to browse
            </p>
            <p className="text-xs text-gray-500">
              Supports PNG, JPG, GIF, WebP
            </p>
          </div>
          <input
            id="file-input"
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileInput}
            disabled={isUploading}
          />
        </div>

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

      {/* Export Configuration */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Export Configuration</h3>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Project Name
            </label>
            <input
              type="text"
              value={exportConfig.name}
              onChange={(e) => onExportConfigChange({ ...exportConfig, name: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="My Character"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Width
              </label>
              <input
                type="number"
                value={exportConfig.width}
                onChange={(e) => onExportConfigChange({ 
                  ...exportConfig, 
                  width: parseInt(e.target.value) || 800 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Height
              </label>
              <input
                type="number"
                value={exportConfig.height}
                onChange={(e) => onExportConfigChange({ 
                  ...exportConfig, 
                  height: parseInt(e.target.value) || 600 
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                min="1"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Layer Stats */}
      <div className="space-y-2">
        <h4 className="font-medium text-gray-800">Project Stats</h4>
        <div className="text-sm text-gray-600 space-y-1">
          <p>Layers: {layers.length}</p>
          <p>Canvas: {exportConfig.width} × {exportConfig.height}px</p>
          <p>Visible: {layers.filter(l => l.visible).length}</p>
        </div>
      </div>

      {/* Export Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-800">Export</h3>
        
        {layers.length === 0 ? (
          <p className="text-sm text-gray-500">Upload layers to enable export</p>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              Export your project with {layers.length} layer{layers.length !== 1 ? 's' : ''}
            </p>
            
            <div className="grid grid-cols-1 gap-2">
              <button
                onClick={() => onExport('png')}
                className={exportButton({ variant: 'primary', disabled: layers.length === 0 })}
                disabled={layers.length === 0}
              >
                <span>📷</span>
                <span>Export as PNG</span>
              </button>
              
              <button
                onClick={() => onExport('json')}
                className={exportButton({ variant: 'secondary', disabled: layers.length === 0 })}
                disabled={layers.length === 0}
              >
                <span>📄</span>
                <span>Export Project (JSON)</span>
              </button>
              
              <button
                onClick={() => onExport('godot')}
                className={exportButton({ variant: 'success', disabled: layers.length === 0 })}
                disabled={layers.length === 0}
              >
                <span>🎮</span>
                <span>Export for Godot</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
} 