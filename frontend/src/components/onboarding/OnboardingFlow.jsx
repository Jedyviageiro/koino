import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  Clock3,
  Feather,
  Gauge,
  Library,
  LoaderCircle,
  Moon,
  Sparkles,
  Sun,
  Sunrise,
  TrendingUp,
} from 'lucide-react'
import { completeOnboarding } from '@/features/onboarding/onboardingService.js'

const steps = [
  {
    eyebrow: 'Getting started',
    title: 'Welcome to Koino.',
    subtitle:
      "To build a reading plan that fits your life, let's start with a little background.",
    field: 'journeyDescription',
    options: [
      {
        value: 'NEW_TO_FAITH',
        title: 'Just starting out',
        description: 'New to reading the Bible and ready to learn',
        icon: Clock3,
      },
      {
        value: 'DEEPEN_UNDERSTANDING',
        title: 'Deepening my understanding',
        description: "I've read some parts and want to grow further",
        icon: TrendingUp,
      },
      {
        value: 'BUILD_READING_HABIT',
        title: 'Building a daily habit',
        description: 'I want a consistent, structured plan to follow',
        icon: CalendarDays,
      },
    ],
  },
  {
    eyebrow: 'Choose your path',
    title: 'Where would you like to begin?',
    subtitle:
      'Your starting point shapes the first plan while keeping the whole Bible ahead of you.',
    field: 'preferredStartingPoint',
    options: [
      {
        value: 'GOSPELS',
        title: 'The Gospels',
        description: 'Begin with the life and teachings of Jesus',
        icon: BookOpen,
      },
      {
        value: 'NEW_TESTAMENT',
        title: 'The New Testament',
        description: 'Explore the early church, letters, and Christian life',
        icon: BookMarked,
      },
      {
        value: 'OLD_TESTAMENT',
        title: 'The Old Testament',
        description: 'Start with creation, covenant, wisdom, and the prophets',
        icon: Library,
      },
    ],
  },
  {
    eyebrow: 'Find your moment',
    title: 'When do you read best?',
    subtitle:
      'Choose the part of your day when reflection feels most natural and sustainable.',
    field: 'dailyRhythm',
    options: [
      {
        value: 'MORNING',
        title: 'Morning',
        description: 'Start the day with a clear mind and quiet focus',
        icon: Sunrise,
      },
      {
        value: 'AFTERNOON',
        title: 'Afternoon',
        description: 'Pause and reset in the middle of your day',
        icon: Sun,
      },
      {
        value: 'EVENING',
        title: 'Evening',
        description: 'Slow down, reflect, and close the day intentionally',
        icon: Moon,
      },
    ],
  },
  {
    eyebrow: 'Set your pace',
    title: 'How much time feels realistic?',
    subtitle:
      'A sustainable rhythm matters more than speed. You can adjust this later.',
    field: 'pace',
    options: [
      {
        value: 'GENTLE',
        workPace: 'FLEXIBLE',
        dailyCapacityMinutes: 10,
        title: 'A gentle rhythm',
        description: 'Around 10 minutes, with a flexible weekly pace',
        icon: Feather,
      },
      {
        value: 'STEADY',
        workPace: 'STEADY_NINE_TO_FIVE',
        dailyCapacityMinutes: 20,
        title: 'Steady progress',
        description: 'Around 20 minutes of focused reading each day',
        icon: Gauge,
      },
      {
        value: 'DEEP',
        workPace: 'STEADY_NINE_TO_FIVE',
        dailyCapacityMinutes: 30,
        title: 'Go deeper',
        description: 'Around 30 minutes for reading and reflection',
        icon: Sparkles,
      },
    ],
  },
]

const initialAnswers = {
  journeyDescription: 'NEW_TO_FAITH',
  preferredStartingPoint: 'GOSPELS',
  dailyRhythm: 'MORNING',
  pace: 'GENTLE',
  workPace: 'FLEXIBLE',
  dailyCapacityMinutes: 10,
}

function OnboardingFlow({ onFailure }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState(initialAnswers)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isComplete, setIsComplete] = useState(false)

  const step = steps[stepIndex]
  const isLastStep = stepIndex === steps.length - 1

  function selectOption(option) {
    if (step.field === 'pace') {
      setAnswers((current) => ({
        ...current,
        pace: option.value,
        workPace: option.workPace,
        dailyCapacityMinutes: option.dailyCapacityMinutes,
      }))
      return
    }

    setAnswers((current) => ({
      ...current,
      [step.field]: option.value,
    }))
  }

  async function finishOnboarding() {
    setIsSubmitting(true)

    try {
      await completeOnboarding({
        journeyDescription: answers.journeyDescription,
        preferredStartingPoint: answers.preferredStartingPoint,
        dailyRhythm: answers.dailyRhythm,
        workPace: answers.workPace,
        dailyCapacityMinutes: answers.dailyCapacityMinutes,
      })
      setIsComplete(true)
    } catch (error) {
      onFailure(
        error.message || 'Unable to save your preferences. Please try again.',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  function continueFlow() {
    if (isLastStep) {
      finishOnboarding()
    } else {
      setStepIndex((current) => current + 1)
    }
  }

  if (isComplete) {
    return (
      <div className="flex min-h-[520px] animate-[auth-panel-in_320ms_ease-out] flex-col items-center justify-center text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#e8f8f2] text-[#22a978]">
          <CheckCircle2 className="h-8 w-8" strokeWidth={1.8} aria-hidden="true" />
        </div>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.12em] text-[#1e55e5]">
          You&apos;re all set
        </p>
        <h2 className="mt-3 text-[28px] font-semibold tracking-normal text-[#111114]">
          Your reading plan is ready.
        </h2>
        <p className="mt-3 max-w-[390px] text-[13px] leading-6 text-[#7b7f87]">
          Koino has created your first progressive plan from the rhythm and
          starting point you chose.
        </p>
      </div>
    )
  }

  return (
    <div className="flex min-h-[570px] w-full flex-col">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {steps.map((item, index) => (
            <span
              key={item.field}
              className={`h-[3px] w-7 rounded-full transition-colors duration-300 ${
                index <= stepIndex ? 'bg-[#17171a]' : 'bg-[#e4e5e8]'
              }`}
            />
          ))}
          <span className="ml-2 text-[11px] font-semibold text-[#93969d]">
            {stepIndex + 1} of {steps.length}
          </span>
        </div>
        {!isLastStep && (
          <button
            type="button"
            onClick={continueFlow}
            className="text-[12px] font-medium text-[#8b8e96] hover:text-[#17171a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e55e5]"
          >
            Skip
          </button>
        )}
      </div>

      <div
        key={step.field}
        className="mt-9 animate-[auth-panel-in_280ms_ease-out]"
      >
        <p className="inline-flex rounded-full bg-[#eef2ff] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#1e55e5]">
          {step.eyebrow}
        </p>
        <h2 className="mt-4 text-[29px] font-semibold leading-[1.15] tracking-normal text-[#111114]">
          {step.title}
        </h2>
        <p className="mt-2 max-w-[470px] text-[13px] leading-5 text-[#858890]">
          {step.subtitle}
        </p>

        <div className="mt-7 space-y-2.5">
          {step.options.map((option) => {
            const selected = answers[step.field] === option.value
            const Icon = option.icon

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => selectOption(option)}
                className={`flex min-h-[72px] w-full items-center gap-3.5 rounded-[13px] border px-4 py-3 text-left transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e55e5] ${
                  selected
                    ? 'border-[#1e55e5] bg-[#f0f4ff]'
                    : 'border-[#e7e8eb] bg-white hover:-translate-y-px hover:border-[#bdc9ef] hover:bg-[#fafbff]'
                }`}
                aria-pressed={selected}
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] transition-colors ${
                    selected
                      ? 'bg-[#1e55e5] text-white'
                      : 'bg-[#f5f5f7] text-[#4c5058]'
                  }`}
                >
                  <Icon className="h-[18px] w-[18px]" strokeWidth={1.8} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-[#17171a]">
                    {option.title}
                  </span>
                  <span className="mt-0.5 block text-[11px] leading-4 text-[#8b8e96]">
                    {option.description}
                  </span>
                </span>
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
                    selected
                      ? 'border-[#1e55e5] bg-[#1e55e5] text-white'
                      : 'border-[#dfe1e5] text-transparent'
                  }`}
                >
                  <Check className="h-3 w-3" strokeWidth={2.5} />
                </span>
              </button>
            )
          })}
        </div>
      </div>

      <div className="mt-auto flex items-center gap-3 pt-7">
        <button
          type="button"
          onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
          disabled={stepIndex === 0 || isSubmitting}
          className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[11px] border border-[#e1e2e5] bg-white text-[#17171a] transition-colors hover:bg-[#f6f6f8] disabled:cursor-not-allowed disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e55e5]"
          aria-label="Previous step"
          title="Previous step"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.9} />
        </button>
        <button
          type="button"
          onClick={continueFlow}
          disabled={isSubmitting}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-[11px] bg-[#1e55e5] text-[13px] font-semibold text-white transition-colors hover:bg-[#194bcf] active:bg-[#1542ba] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1e55e5]"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              Creating your plan
            </>
          ) : (
            <>
              {isLastStep ? 'Create My Plan' : 'Continue'}
              <ArrowRight className="h-4 w-4" strokeWidth={1.9} />
            </>
          )}
        </button>
      </div>
    </div>
  )
}

export default OnboardingFlow
