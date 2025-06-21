import { useRef, useCallback, useState, useEffect } from 'react'
import type { UploadedLayer, DragState } from '../types/sprite'

type DraggableCanvasProps = {
  baseLayer: UploadedLayer | null
  additionalLayers: UploadedLayer[]
  onLayerPositionChange: (layerId: string, x: number, y: number) => void
  onLayerSelect?: (layerId: string | null) => void
  selectedLayerId?: string | null
}

export const DraggableCanvas = ({ 
  baseLayer, 
  additionalLayers, 
  onLayerPositionChange,
  onLayerSelect,
  selectedLayerId 
}: DraggableCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    draggedLayerId: null,
    dragOffset: { x: 0, y: 0 }
  })

  const allLayers = baseLayer ? [baseLayer, ...additionalLayers] : additionalLayers
  const sortedLayers = allLayers.sort((a, b) => a.position.zIndex - b.position.zIndex)

  // Calculate canvas dimensions based on all layers
  const canvasDimensions = allLayers.reduce(
    (acc, layer) => ({
      width: Math.max(acc.width, layer.position.x + layer.dimensions.width),
      height: Math.max(acc.height, layer.position.y + layer.dimensions.height)
    }),
    { width: baseLayer?.dimensions.width || 400, height: baseLayer?.dimensions.height || 400 }
  )

  const handleMouseDown = useCallback((e: React.MouseEvent, layerId: string) => {
    if (!layerId || layerId === baseLayer?.id) return // Don't allow dragging base layer

    e.preventDefault()
    e.stopPropagation()

    const layer = additionalLayers.find(l => l.id === layerId)
    if (!layer) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const offsetX = e.clientX - rect.left - layer.position.x
    const offsetY = e.clientY - rect.top - layer.position.y

    setDragState({
      isDragging: true,
      draggedLayerId: layerId,
      dragOffset: { x: offsetX, y: offsetY }
    })

    onLayerSelect?.(layerId)
  }, [additionalLayers, baseLayer?.id, onLayerSelect])

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!dragState.isDragging || !dragState.draggedLayerId) return

    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect) return

    const newX = Math.max(0, e.clientX - rect.left - dragState.dragOffset.x)
    const newY = Math.max(0, e.clientY - rect.top - dragState.dragOffset.y)

    onLayerPositionChange(dragState.draggedLayerId, newX, newY)
  }, [dragState, onLayerPositionChange])

  const handleMouseUp = useCallback(() => {
    setDragState({
      isDragging: false,
      draggedLayerId: null,
      dragOffset: { x: 0, y: 0 }
    })
  }, [])

  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onLayerSelect?.(null)
    }
  }, [onLayerSelect])

  // Add global mouse event listeners when dragging
  useEffect(() => {
    if (dragState.isDragging) {
      const handleGlobalMouseMove = (e: MouseEvent) => {
        if (!dragState.draggedLayerId) return

        const rect = canvasRef.current?.getBoundingClientRect()
        if (!rect) return

        const newX = Math.max(0, e.clientX - rect.left - dragState.dragOffset.x)
        const newY = Math.max(0, e.clientY - rect.top - dragState.dragOffset.y)

        onLayerPositionChange(dragState.draggedLayerId, newX, newY)
      }

      const handleGlobalMouseUp = () => {
        setDragState({
          isDragging: false,
          draggedLayerId: null,
          dragOffset: { x: 0, y: 0 }
        })
      }

      document.addEventListener('mousemove', handleGlobalMouseMove)
      document.addEventListener('mouseup', handleGlobalMouseUp)

      return () => {
        document.removeEventListener('mousemove', handleGlobalMouseMove)
        document.removeEventListener('mouseup', handleGlobalMouseUp)
      }
    }
  }, [dragState, onLayerPositionChange])

  if (!baseLayer && additionalLayers.length === 0) {
    return (
      <div className="w-full h-64 bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center">
        <p className="text-gray-500">Upload a character base to start</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div
          ref={canvasRef}
          className="relative bg-gray-50 border border-gray-300 rounded overflow-hidden cursor-crosshair"
          style={{
            width: Math.min(canvasDimensions.width, 600),
            height: Math.min(canvasDimensions.height, 600),
            backgroundImage: `
              linear-gradient(45deg, #f0f0f0 25%, transparent 25%),
              linear-gradient(-45deg, #f0f0f0 25%, transparent 25%),
              linear-gradient(45deg, transparent 75%, #f0f0f0 75%),
              linear-gradient(-45deg, transparent 75%, #f0f0f0 75%)
            `,
            backgroundSize: '20px 20px',
            backgroundPosition: '0 0, 0 10px, 10px -10px, -10px 0px'
          }}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onClick={handleCanvasClick}
        >
          {sortedLayers.map((layer) => (
            <div
              key={layer.id}
              className={`absolute select-none ${
                layer.isBase 
                  ? 'cursor-default' 
                  : 'cursor-move hover:ring-2 hover:ring-blue-400'
              } ${
                selectedLayerId === layer.id 
                  ? 'ring-2 ring-blue-500' 
                  : ''
              } ${
                dragState.draggedLayerId === layer.id 
                  ? 'opacity-75 z-50' 
                  : ''
              }`}
              style={{
                left: layer.position.x,
                top: layer.position.y,
                zIndex: layer.position.zIndex,
                opacity: layer.visible ? layer.opacity : 0.3
              }}
              onMouseDown={(e) => handleMouseDown(e, layer.id)}
              title={`${layer.name} (${layer.position.x}, ${layer.position.y})`}
            >
              <img
                src={layer.imageData}
                alt={layer.name}
                className="block"
                style={{ 
                  imageRendering: 'pixelated',
                  width: layer.dimensions.width,
                  height: layer.dimensions.height
                }}
                draggable={false}
              />
              {!layer.isBase && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" />
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-gray-500 space-y-1">
        <p>• Click and drag layers to reposition them</p>
        <p>• Base layer cannot be moved</p>
        <p>• Canvas size: {canvasDimensions.width} × {canvasDimensions.height}px</p>
      </div>
    </div>
  )
} 