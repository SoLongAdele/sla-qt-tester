/**
 * 加载组件
 */
interface LoadingProps {
  text?: string
}

export default function Loading({ text = '加载中...' }: LoadingProps) {
  return (
    <div className="flex flex-col items-center justify-center h-screen bg-dots">
      <div className="glass-panel p-8 rounded-2xl flex flex-col items-center gap-4">
        <div className="spinner" />
        <p className="text-gray-600 dark:text-gray-400">{text}</p>
      </div>
    </div>
  )
}

