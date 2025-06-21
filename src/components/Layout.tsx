import type { ReactNode } from 'react'

type LayoutProps = {
  title: string
  sidebar: ReactNode
  canvas: ReactNode
  layerPanel: ReactNode
}

export const Layout = ({ title, sidebar, canvas, layerPanel }: LayoutProps) => {
  return (
    <div className="h-screen flex flex-col bg-gray-100">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
        <div className="flex items-center space-x-4">
          <div className="text-sm text-gray-600">Character Layer Builder</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
          {sidebar}
        </div>

        {/* Canvas Area */}
        <div className="flex-1 relative">
          {canvas}
          
          {/* Floating Layer Panel - Top Left */}
          <div className="absolute top-4 left-4 z-40">
            {layerPanel}
          </div>
        </div>
      </div>
    </div>
  )
} 