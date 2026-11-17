'use client'

import React, { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import type { QuizBlock } from '@/lib/digests/types'

export default function QuizRenderer({ block }: { block: QuizBlock }) {
  const [currentIdx, setCurrentIdx] = useState<number>(0)
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null)
  const [score, setScore] = useState<number>(0)
  const [isCompleted, setIsCompleted] = useState<boolean>(false)

  const questions = block.q
  const currentQ = questions[currentIdx]

  const handleSelect = (idx: number) => {
    if (selectedIdx !== null) return // Already answered
    setSelectedIdx(idx)
    if (idx === currentQ[2]) {
      setScore((prev) => prev + 1)
    }
  }

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx((prev) => prev + 1)
      setSelectedIdx(null)
    } else {
      setIsCompleted(true)
    }
  }

  const handleReset = () => {
    setCurrentIdx(0)
    setSelectedIdx(null)
    setScore(0)
    setIsCompleted(false)
  }

  return (
    <div className="bg-white rounded-2xl border border-[#F5ECDE] p-6 md:p-8 shadow-2xs mt-5 max-w-2xl">
      {!isCompleted ? (
        <div>
          <div className="flex items-center justify-between text-xs text-[#5A5D70] font-semibold tracking-wider uppercase mb-2">
            <span>
              Question {currentIdx + 1} of {questions.length}
            </span>
            <span>Score: {score}</span>
          </div>

          <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-base sm:text-lg font-bold text-[#232536] my-2 leading-snug">
            {currentQ[0]}
          </h3>

          <div className="space-y-2 mt-4">
            {currentQ[1].map((optionText, optIdx) => {
              const isSelected = selectedIdx === optIdx
              const isCorrectAnswer = optIdx === currentQ[2]
              const hasAnswered = selectedIdx !== null

              let optClasses =
                'w-full text-left p-3.5 rounded-xl border text-xs sm:text-sm transition-all font-medium min-h-[44px] flex items-center justify-between cursor-pointer '

              if (!hasAnswered) {
                optClasses +=
                  'bg-white border-[#F5ECDE] text-[#232536] hover:border-[#EF5B45] hover:bg-[#FDF8F1]'
              } else if (isCorrectAnswer) {
                optClasses += 'bg-[#E3F3EA] border-[#1F8A5B] text-[#1F8A5B] font-semibold'
              } else if (isSelected) {
                optClasses += 'bg-[#FBE5E0] border-[#D5402B] text-[#D5402B] font-semibold'
              } else {
                optClasses += 'bg-white border-[#F5ECDE]/60 text-[#5A5D70] opacity-50'
              }

              return (
                <button
                  key={optIdx}
                  type="button"
                  onClick={() => handleSelect(optIdx)}
                  disabled={hasAnswered}
                  className={optClasses}
                >
                  <span>{optionText}</span>
                  {hasAnswered && isCorrectAnswer && (
                    <span className="text-[#1F8A5B] text-base font-bold ml-2">✓</span>
                  )}
                  {hasAnswered && isSelected && !isCorrectAnswer && (
                    <span className="text-[#D5402B] text-base font-bold ml-2">✗</span>
                  )}
                </button>
              )
            })}
          </div>

          {selectedIdx !== null && (
            <div className="mt-4 pt-3.5 border-t border-[#F5ECDE] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in duration-200">
              <p className="text-xs sm:text-sm text-[#5A5D70] leading-relaxed">
                <strong className={selectedIdx === currentQ[2] ? 'text-[#1F8A5B]' : 'text-[#D5402B]'}>
                  {selectedIdx === currentQ[2] ? 'Correct. ' : 'Not quite. '}
                </strong>
                {currentQ[3]}
              </p>
              <button
                type="button"
                onClick={handleNext}
                className="group shrink-0 inline-flex items-center justify-center gap-1.5 min-h-[38px] px-5 py-2 rounded-xl text-xs font-semibold bg-[#232536] hover:bg-black text-white transition-colors cursor-pointer shadow-xs self-end sm:self-auto"
              >
                <span>{currentIdx < questions.length - 1 ? 'Next' : 'See my score'}</span>
                <ArrowRight
                  size={14}
                  strokeWidth={2.5}
                  aria-hidden="true"
                  className="transition-transform duration-300 group-hover:translate-x-1 motion-reduce:group-hover:translate-x-0"
                />
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-[#E3F3EA] text-[#1F8A5B] text-2xl font-bold mb-3 font-['MTN_Brighter_Sans',_sans-serif]">
            {score}/{questions.length}
          </div>
          <h3 className="font-['MTN_Brighter_Sans',_sans-serif] text-xl font-bold text-[#232536]">
            You got {score} of {questions.length}
          </h3>
          <p className="text-xs sm:text-sm text-[#5A5D70] mt-2 max-w-md mx-auto leading-relaxed">
            {score >= Math.ceil(questions.length * 0.7)
              ? 'You have the heart of the report. Now pass one idea on to one person.'
              : 'Scroll back through the sections above, then try again.'}
          </p>
          <button
            type="button"
            onClick={handleReset}
            className="mt-5 inline-flex items-center justify-center min-h-[40px] px-5 py-2 rounded-xl text-xs font-semibold bg-[#CF3F29] hover:bg-[#b83420] text-white transition-colors cursor-pointer shadow-xs"
          >
            Try again
          </button>
        </div>
      )}
    </div>
  )
}
