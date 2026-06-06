'use client'

import { MergedStep, isOverdue } from '@/lib/pipeline'

interface ProcessBarProps {
  mergedSteps: MergedStep[]
  currentPosition: number | null
}

export function ProcessBar({ mergedSteps, currentPosition }: ProcessBarProps) {
  if (!currentPosition || mergedSteps.length === 0) {
    return <div className="text-sm text-gray-400">—</div>
  }

  const currentStep = mergedSteps[currentPosition - 1]
  if (!currentStep) {
    return <div className="text-sm text-gray-400">—</div>
  }

  const progressPercent = (currentPosition / mergedSteps.length) * 100
  const overdueClass = currentStep.due_date && isOverdue(currentStep.due_date) ? 'text-red-600' : 'text-gray-600'

  return (
    <div className="flex flex-col gap-1.5">
      <div className="text-xs text-gray-500">
        Schritt {currentPosition}/{mergedSteps.length} · <strong>{currentStep.label}</strong>
      </div>
      <div className="flex gap-2 items-center">
        <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-blue-500 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {currentStep.due_date && (
          <div className={`text-xs font-medium whitespace-nowrap ${overdueClass}`}>
            {isOverdue(currentStep.due_date) ? '⏰ ' : ''}
            {new Date(currentStep.due_date).toLocaleDateString('de-DE')}
          </div>
        )}
      </div>
    </div>
  )
}
