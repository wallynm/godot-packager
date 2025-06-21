import { useEffect, useRef, useState } from 'react'
import type { SelectedLayers } from '../App'
import { getAssetPath, type AssetCategory } from '../utils/assetLoader'

type SpriteCanvasProps = {
  selectedLayers: SelectedLayers
}

export const SpriteCanvas = ({ selectedLayers }: SpriteCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [loadedImages, setLoadedImages] = useState<Record<string, HTMLImageElement>>({})
  const [isLoading, setIsLoading] = useState(false)

  const loadImage = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      if (loadedImages[src]) {
        resolve(loadedImages[src])
        return
      }

      const img = new Image()
      img.onload = () => {
        setLoadedImages(prev => ({ ...prev, [src]: img }))
        resolve(img)
      }
      img.onerror = reject
      img.src = src
    })
  }

  const drawSprite = async () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    setIsLoading(true)

    const layerOrder: (keyof SelectedLayers)[] = ['characters', 'clothes', 'eyes', 'hair', 'acc']
    
    try {
      let canvasInitialized = false
      
      for (const layerType of layerOrder) {
        const assetName = selectedLayers[layerType]
        if (!assetName) continue

        const imagePath = getAssetPath(layerType as AssetCategory, assetName)

        try {
          const img = await loadImage(imagePath)
          
          if (!canvasInitialized) {
            canvas.width = Math.min(img.naturalWidth, 512)
            canvas.height = Math.min(img.naturalHeight, 512)
            ctx.clearRect(0, 0, canvas.width, canvas.height)
            
            ctx.imageSmoothingEnabled = false
            canvasInitialized = true
          }
          
          const scaleX = canvas.width / img.naturalWidth
          const scaleY = canvas.height / img.naturalHeight
          const scale = Math.min(scaleX, scaleY)
          
          const drawWidth = img.naturalWidth * scale
          const drawHeight = img.naturalHeight * scale
          const x = (canvas.width - drawWidth) / 2
          const y = (canvas.height - drawHeight) / 2
          
          ctx.drawImage(img, x, y, drawWidth, drawHeight)
        } catch (error) {
          console.warn(`Failed to load image: ${imagePath}`, error)
        }
      }
      
      if (!canvasInitialized) {
        canvas.width = 256
        canvas.height = 256
        ctx.clearRect(0, 0, canvas.width, canvas.height)
      }
    } catch (error) {
      console.error('Error drawing sprite:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    drawSprite()
  }, [selectedLayers, loadedImages])

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={256}
        height={256}
        className="border border-gray-300 rounded-lg bg-white shadow-sm max-w-full"
        style={{ imageRendering: 'pixelated' }}
      />
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-75 rounded-lg">
          <div className="text-sm text-gray-600">Loading...</div>
        </div>
      )}
    </div>
  )
} 