import { useRef, useCallback, useState, useEffect } from 'react'
import {
  DndContext,
  DragOverlay,
  useDraggable,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core'
import type { UploadedLayer, ExportConfig } from '../types/sprite'

type DraggableCanvasProps = {
  layers: UploadedLayer[]
  selectedLayerId: string | null
  exportConfig: ExportConfig
  onLayerUpdate: (layerId: string, updates: Partial<UploadedLayer>) => void
  onLayerSelect: (layerId: string | null) => void
  snapToGrid?: boolean
  gridSize?: number
}

type DraggableLayerProps = {
  layer: UploadedLayer
  isSelected: boolean
  zoom: number
  canvasCenter: { x: number; y: number }
  pan: { x: number; y: number }
  exportConfig: ExportConfig
  onSelect: (layerId: string) => void
}

const DraggableLayer = ({ 
  layer, 
  isSelected, 
  zoom, 
  canvasCenter, 
  pan,
  exportConfig, 
  onSelect 
}: DraggableLayerProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    isDragging,
  } = useDraggable({
    id: layer.id,
    disabled: false, // We'll handle Alt key in the drag start handler
  })

  const style = {
    position: 'absolute' as const,
    left: layer.position.x * zoom + canvasCenter.x - (exportConfig.width * zoom) / 2 + pan.x,
    top: layer.position.y * zoom + canvasCenter.y - (exportConfig.height * zoom) / 2 + pan.y,
    zIndex: layer.position.zIndex + 100,
    opacity: layer.visible ? layer.opacity : 0.3,
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0) scale(${zoom})` : `scale(${zoom})`,
    transformOrigin: 'top left',
    cursor: isDragging ? 'grabbing' : 'grab',
    transition: 'none',
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`select-none ${
        isSelected 
          ? 'ring-2 ring-blue-500 ring-offset-2' 
          : 'hover:ring-2 hover:ring-blue-400 hover:ring-offset-1'
      }`}
      onClick={(e) => {
        // Don't select layer if Alt key is pressed (for panning)
        if (!e.altKey) {
          e.stopPropagation()
          onSelect(layer.id)
        }
      }}
      title={`${layer.name} (${layer.position.x}, ${layer.position.y})`}
    >
      <img
        src={layer.imageData}
        alt={layer.name}
        className="block pointer-events-none"
        style={{ 
          imageRendering: 'pixelated',
          width: layer.width,
          height: layer.height,
          transition: 'none'
        }}
        draggable={false}
      />
      
      {/* Layer selection indicator */}
      {isSelected && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full animate-pulse" />
      )}
    </div>
  )
}

export const DraggableCanvas = ({ 
  layers, 
  selectedLayerId,
  exportConfig,
  onLayerUpdate,
  onLayerSelect,
  snapToGrid: initialSnapToGrid = true,
  gridSize: initialGridSize = 16
}: DraggableCanvasProps) => {
  const canvasRef = useRef<HTMLDivElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 })
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [activeId, setActiveId] = useState<string | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  const [lastPanPoint, setLastPanPoint] = useState({ x: 0, y: 0 })
  const [snapToGrid, setSnapToGrid] = useState(initialSnapToGrid)
  const [gridSize, setGridSize] = useState(initialGridSize)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 0,
      },
    })
  )

  // Sort layers by z-index
  const sortedLayers = [...layers].sort((a, b) => a.position.zIndex - b.position.zIndex)

  // Update canvas size on resize
  useEffect(() => {
    const updateCanvasSize = () => {
      if (canvasRef.current) {
        const rect = canvasRef.current.getBoundingClientRect()
        setCanvasSize({ width: rect.width, height: rect.height })
      }
    }

    updateCanvasSize()
    window.addEventListener('resize', updateCanvasSize)
    return () => window.removeEventListener('resize', updateCanvasSize)
  }, [])

  // Smart snapping function that considers both grid and other layers
  const smartSnap = useCallback((draggedLayerId: string, newX: number, newY: number) => {
    let snappedX = newX
    let snappedY = newY

    // First apply grid snapping
    if (snapToGrid) {
      snappedX = Math.round(newX / gridSize) * gridSize
      snappedY = Math.round(newY / gridSize) * gridSize
    }

    // Then check for layer-to-layer snapping
    const draggedLayer = layers.find(l => l.id === draggedLayerId)
    if (!draggedLayer) return { x: snappedX, y: snappedY }

    const snapThreshold = 8 // pixels
    const otherLayers = layers.filter(l => l.id !== draggedLayerId && l.visible)

    for (const otherLayer of otherLayers) {
      // Check horizontal alignment (left, center, right edges)
      const draggedLeft = snappedX
      const draggedRight = snappedX + draggedLayer.width
      const draggedCenterX = snappedX + draggedLayer.width / 2

      const otherLeft = otherLayer.position.x
      const otherRight = otherLayer.position.x + otherLayer.width
      const otherCenterX = otherLayer.position.x + otherLayer.width / 2

      // Snap to left edge
      if (Math.abs(draggedLeft - otherLeft) < snapThreshold) {
        snappedX = otherLeft
      }
      // Snap to right edge
      else if (Math.abs(draggedRight - otherRight) < snapThreshold) {
        snappedX = otherRight - draggedLayer.width
      }
      // Snap to center
      else if (Math.abs(draggedCenterX - otherCenterX) < snapThreshold) {
        snappedX = otherCenterX - draggedLayer.width / 2
      }

      // Check vertical alignment (top, center, bottom edges)
      const draggedTop = snappedY
      const draggedBottom = snappedY + draggedLayer.height
      const draggedCenterY = snappedY + draggedLayer.height / 2

      const otherTop = otherLayer.position.y
      const otherBottom = otherLayer.position.y + otherLayer.height
      const otherCenterY = otherLayer.position.y + otherLayer.height / 2

      // Snap to top edge
      if (Math.abs(draggedTop - otherTop) < snapThreshold) {
        snappedY = otherTop
      }
      // Snap to bottom edge
      else if (Math.abs(draggedBottom - otherBottom) < snapThreshold) {
        snappedY = otherBottom - draggedLayer.height
      }
      // Snap to center
      else if (Math.abs(draggedCenterY - otherCenterY) < snapThreshold) {
        snappedY = otherCenterY - draggedLayer.height / 2
      }
    }

    return { x: snappedX, y: snappedY }
  }, [layers, snapToGrid, gridSize])

  // Handle drag start
  const handleDragStart = useCallback((event: DragStartEvent) => {
    // Don't start layer dragging if Alt key is pressed (for panning)
    if ((event.activatorEvent as MouseEvent)?.altKey) {
      return
    }
    setActiveId(event.active.id as string)
    onLayerSelect(event.active.id as string)
  }, [onLayerSelect])

  // Handle drag end
  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, delta } = event
    
    if (!delta) {
      setActiveId(null)
      return
    }

    const layer = layers.find(l => l.id === active.id)
    if (!layer) {
      setActiveId(null)
      return
    }

    const deltaX = delta.x / zoom
    const deltaY = delta.y / zoom
    
    const rawNewX = layer.position.x + deltaX
    const rawNewY = layer.position.y + deltaY
    
    const snappedPosition = smartSnap(layer.id, rawNewX, rawNewY)
    
    onLayerUpdate(layer.id, {
      position: {
        ...layer.position,
        x: snappedPosition.x,
        y: snappedPosition.y
      }
    })

    setActiveId(null)
  }, [layers, onLayerUpdate, smartSnap, zoom])

  // Handle canvas click (deselect)
  const handleCanvasClick = useCallback((e: React.MouseEvent) => {
    // Don't deselect if Alt key is pressed (for panning)
    if (!e.altKey && !isPanning) {
      onLayerSelect(null)
    }
  }, [onLayerSelect, isPanning])

  // Handle zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    
    const delta = e.deltaY * -0.001
    const newZoom = Math.max(0.1, Math.min(3, zoom + delta))
    
    if (newZoom !== zoom && canvasRef.current) {
      // Get mouse position relative to canvas
      const rect = canvasRef.current.getBoundingClientRect()
      const mouseX = e.clientX - rect.left
      const mouseY = e.clientY - rect.top
      
      // Calculate the world position under the mouse before zoom
      // We need to account for the canvas center offset in our world coordinate system
      const canvasCenterX = canvasSize.width / 2
      const canvasCenterY = canvasSize.height / 2
      
      // Convert mouse position to world coordinates
      const worldX = (mouseX - canvasCenterX - pan.x) / zoom
      const worldY = (mouseY - canvasCenterY - pan.y) / zoom
      
      // Calculate new pan to keep the same world position under the mouse after zoom
      const newPanX = mouseX - canvasCenterX - worldX * newZoom
      const newPanY = mouseY - canvasCenterY - worldY * newZoom
      
      setPan({ x: newPanX, y: newPanY })
      setZoom(newZoom)
    }
  }, [zoom, pan])

  // Handle pan start
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) { // Middle mouse or Alt+Left mouse
      e.preventDefault()
      e.stopPropagation()
      setIsPanning(true)
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }
  }, [])

  // Handle pan move
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (isPanning) {
      e.preventDefault()
      const deltaX = e.clientX - lastPanPoint.x
      const deltaY = e.clientY - lastPanPoint.y
      
      setPan(prev => ({
        x: prev.x + deltaX,
        y: prev.y + deltaY
      }))
      
      setLastPanPoint({ x: e.clientX, y: e.clientY })
    }
  }, [isPanning, lastPanPoint])

  // Handle pan end
  const handleMouseUp = useCallback(() => {
    setIsPanning(false)
  }, [])

  // Handle mouse leave to stop panning
  const handleMouseLeave = useCallback(() => {
    setIsPanning(false)
  }, [])

  // Calculate canvas center for positioning
  const canvasCenter = {
    x: canvasSize.width / 2,
    y: canvasSize.height / 2
  }

  // Calculate export area position (centered)
  const exportArea = {
    x: canvasCenter.x - (exportConfig.width * zoom) / 2 + pan.x,
    y: canvasCenter.y - (exportConfig.height * zoom) / 2 + pan.y,
    width: exportConfig.width * zoom,
    height: exportConfig.height * zoom
  }

  // Get the active layer for drag overlay
  const activeLayer = activeId ? layers.find(l => l.id === activeId) : null

  return (
    <div className="h-full w-full relative overflow-hidden bg-gray-900">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* Canvas */}
        <div
          ref={canvasRef}
          className={`h-full w-full relative ${isPanning ? 'cursor-grabbing' : 'cursor-grab'}`}
          onClick={handleCanvasClick}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseLeave}
          style={{
            backgroundImage: snapToGrid ? `
              radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)
            ` : undefined,
            backgroundSize: snapToGrid ? `${gridSize * zoom}px ${gridSize * zoom}px` : undefined,
            backgroundPosition: `${pan.x}px ${pan.y}px`
          }}
        >
          {/* Export Area Outline */}
          <div
            className="absolute border-2 border-blue-400 border-dashed bg-white bg-opacity-10 pointer-events-none"
            style={{
              left: exportArea.x,
              top: exportArea.y,
              width: exportArea.width,
              height: exportArea.height
            }}
          >
            <div className="absolute -top-6 left-0 text-xs text-blue-400 font-medium">
              Export Area ({exportConfig.width} × {exportConfig.height}px)
            </div>
          </div>

          {/* Layers */}
          {sortedLayers.map((layer) => (
            <DraggableLayer
              key={layer.id}
              layer={layer}
              isSelected={selectedLayerId === layer.id}
              zoom={zoom}
              canvasCenter={canvasCenter}
              pan={pan}
              exportConfig={exportConfig}
              onSelect={onLayerSelect}
            />
          ))}
        </div>

        {/* Drag Overlay */}
        <DragOverlay dropAnimation={null}>
          {activeLayer ? (
            <div
              className="select-none opacity-90"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                transition: 'none'
              }}
            >
              <img
                src={activeLayer.imageData}
                alt={activeLayer.name}
                className="block pointer-events-none"
                style={{ 
                  imageRendering: 'pixelated',
                  width: activeLayer.width,
                  height: activeLayer.height,
                  transition: 'none'
                }}
                draggable={false}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>

      {/* Canvas Controls */}
      <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-3 space-y-2 shadow-lg">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => {
              const newZoom = Math.max(0.1, zoom - 0.1)
              if (newZoom !== zoom) {
                // Zoom towards center when using buttons
                const centerX = canvasSize.width / 2
                const centerY = canvasSize.height / 2
                
                // Calculate the world position under the center before zoom
                const worldX = -pan.x / zoom
                const worldY = -pan.y / zoom
                
                // Calculate new pan to keep the same world position under the center after zoom
                const newPanX = -worldX * newZoom
                const newPanY = -worldY * newZoom
                
                setPan({ x: newPanX, y: newPanY })
                setZoom(newZoom)
              }
            }}
            className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium"
          >
            −
          </button>
          <span className="text-sm font-medium min-w-[60px] text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={() => {
              const newZoom = Math.min(3, zoom + 0.1)
              if (newZoom !== zoom) {
                // Zoom towards center when using buttons
                const centerX = canvasSize.width / 2
                const centerY = canvasSize.height / 2
                
                // Calculate the world position under the center before zoom
                const worldX = (centerX - pan.x) / zoom
                const worldY = (centerY - pan.y) / zoom
                
                // Calculate new pan to keep the same world position under the center after zoom
                const newPanX = centerX - worldX * newZoom
                const newPanY = centerY - worldY * newZoom
                
                setPan({ x: newPanX, y: newPanY })
                setZoom(newZoom)
              }
            }}
            className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-sm font-medium"
          >
            +
          </button>
        </div>
        
        <div className="flex items-center space-x-2 text-xs text-gray-600">
          <label className="flex items-center space-x-1">
            <input
              type="checkbox"
              checked={snapToGrid}
              onChange={(e) => setSnapToGrid(e.target.checked)}
              className="rounded"
            />
            <span>Snap to Grid</span>
          </label>
        </div>

        <div className="flex items-center space-x-2 text-xs">
          <button
            onClick={() => setPan({ x: 0, y: 0 })}
            className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs"
            title="Reset camera position"
          >
            Reset Camera
          </button>
          <button
            onClick={() => {
              if (layers.length > 0) {
                // Calculate bounds of all visible layers
                const visibleLayers = layers.filter(l => l.visible)
                if (visibleLayers.length === 0) return
                
                let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
                visibleLayers.forEach(layer => {
                  minX = Math.min(minX, layer.position.x)
                  minY = Math.min(minY, layer.position.y)
                  maxX = Math.max(maxX, layer.position.x + layer.width)
                  maxY = Math.max(maxY, layer.position.y + layer.height)
                })
                
                const contentWidth = maxX - minX
                const contentHeight = maxY - minY
                const padding = 50 // Add some padding
                
                // Calculate zoom to fit content with padding
                const zoomX = (canvasSize.width - padding * 2) / contentWidth
                const zoomY = (canvasSize.height - padding * 2) / contentHeight
                const fitZoom = Math.min(zoomX, zoomY, 3) // Don't zoom more than 3x
                
                // Calculate pan to center the content
                const contentCenterX = (minX + maxX) / 2
                const contentCenterY = (minY + maxY) / 2
                const canvasCenterX = canvasSize.width / 2
                const canvasCenterY = canvasSize.height / 2
                
                setZoom(fitZoom)
                setPan({
                  x: canvasCenterX - contentCenterX * fitZoom,
                  y: canvasCenterY - contentCenterY * fitZoom
                })
              }
            }}
            className="px-2 py-1 bg-gray-200 hover:bg-gray-300 rounded text-xs"
            title="Fit all layers to screen"
            disabled={layers.filter(l => l.visible).length === 0}
          >
            Fit to Screen
          </button>
        </div>
        
        {snapToGrid && (
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <span>Grid:</span>
            <select
              value={gridSize}
              onChange={(e) => setGridSize(Number(e.target.value))}
              className="px-1 py-0.5 bg-white border rounded text-xs"
            >
              <option value={8}>8px</option>
              <option value={16}>16px</option>
              <option value={32}>32px</option>
              <option value={64}>64px</option>
            </select>
          </div>
        )}
        
        <div className="text-xs text-gray-500 text-center">
          Layers: {layers.length}
        </div>
      </div>

      {/* Instructions */}
      {layers.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg p-8 text-center shadow-lg">
            <div className="text-6xl text-gray-400 mb-4">🎨</div>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">Start Creating</h3>
            <p className="text-gray-600 max-w-md">
              Upload your first layer using the sidebar to begin building your character.
              Layers will be positioned at the center and can be dragged around.
            </p>
            <p className="text-gray-500 text-sm mt-2 max-w-md">
              Use middle mouse button or Alt+click to pan the camera. Scroll to zoom.
            </p>
          </div>
        </div>
      )}
    </div>
  )
} 