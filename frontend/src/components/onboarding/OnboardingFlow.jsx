import { useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  BookMarked,
  BookOpen,
  BriefcaseBusiness,
  CalendarDays,
  Check,
  Clock3,
  Compass,
  Feather,
  Gauge,
  Library,
  LoaderCircle,
  Moon,
  RefreshCw,
  Sparkles,
  Sun,
  Sunrise,
  TrendingUp,
} from 'lucide-react'
import CreatingPlanModal from '@/components/onboarding/CreatingPlanModal.jsx'
import { completeOnboarding } from '@/features/onboarding/onboardingService.js'

const steps = [
  {
    eyebrow: 'Your journey',
    title: 'Welcome to Koino.',
    subtitle: 'Tell us where you are today so your first plan meets you there.',
    field: 'journeyDescription',
    icon: Compass,
    options: [
      {
        value: 'NEW_TO_FAITH',
        title: 'Just starting out',
        description: 'New to the Bible and ready to learn',
        icon: Clock3,
      },
      {
        value: 'DEEPEN_UNDERSTANDING',
        title: 'Deepen my understanding',
        description: 'Build on what I already know',
        icon: TrendingUp,
      },
      {
        value: 'BUILD_READING_HABIT',
        title: 'Build a daily habit',
        description: 'Create a consistent reading rhythm',
        icon: CalendarDays,
      },
    ],
  },
  {
    eyebrow: 'Starting point',
    title: 'Where would you like to begin?',
    subtitle: 'Choose the part of Scripture that will open your first plan.',
    field: 'preferredStartingPoint',
    icon: BookMarked,
    options: [
      {
        value: 'GOSPELS',
        title: 'The Gospels',
        description: 'Life and teachings of Jesus',
        detail: 'Begin with the story at the heart of the Christian faith.',
        icon: BookOpen,
      },
      {
        value: 'OLD_TESTAMENT',
        title: 'The Old Testament',
        description: 'Foundations, history, and wisdom',
        detail: 'Explore the promises and stories that shape our faith.',
        icon: Library,
      },
      {
        value: 'NEW_TESTAMENT',
        title: 'The New Testament',
        description: 'Letters and the early Church',
        detail: 'Discover Christian life and the beginning of the Church.',
        icon: BookMarked,
      },
    ],
  },
  {
    eyebrow: 'Daily rhythm',
    title: 'When do you read best?',
    subtitle: 'Choose the moment when you are most likely to find some peace.',
    field: 'dailyRhythm',
    icon: Sunrise,
    options: [
      {
        value: 'MORNING',
        title: 'Early morning',
        description: 'Begin the day with a clear mind',
        icon: Sunrise,
      },
      {
        value: 'AFTERNOON',
        title: 'During the day',
        description: 'Pause, read, and reset',
        icon: Sun,
      },
      {
        value: 'EVENING',
        title: 'In the evening',
        description: 'Close the day with reflection',
        icon: Moon,
      },
    ],
  },
  {
    eyebrow: 'Your schedule',
    title: 'What is your typical work pace?',
    subtitle: 'Your daily routine helps us place reading where it can last.',
    field: 'workPace',
    icon: CalendarDays,
    options: [
      {
        value: 'STEADY_NINE_TO_FIVE',
        title: 'Steady 9-to-5',
        description: 'A regular schedule with predictable hours',
        icon: BriefcaseBusiness,
      },
      {
        value: 'FLEXIBLE',
        title: 'I have a flexible schedule',
        description: 'My hours vary from day to day',
        icon: RefreshCw,
      },
    ],
  },
  {
    eyebrow: 'Reading capacity',
    title: 'How much time can you set aside?',
    subtitle: 'Choose an honest daily target. You can always adjust it later.',
    field: 'dailyCapacityMinutes',
    icon: Gauge,
    options: [
      {
        value: 10,
        title: '10 minutes',
        description: 'A gentle daily commitment',
        icon: Feather,
      },
      {
        value: 20,
        title: '20 minutes',
        description: 'A steady amount of focused time',
        icon: Gauge,
      },
      {
        value: 30,
        title: '30+ minutes',
        description: 'Room to read and reflect more deeply',
        icon: Sparkles,
      },
    ],
  },
]

const initialAnswers = {
  journeyDescription: 'NEW_TO_FAITH',
  preferredStartingPoint: 'GOSPELS',
  dailyRhythm: 'MORNING',
  workPace: 'FLEXIBLE',
  dailyCapacityMinutes: 10,
}

function Progress({ current }) {
  return (
    <div className="flex flex-1 items-center justify-center" aria-label={`Step ${current + 1} of ${steps.length}`}>
      {steps.map((step, index) => {
        const complete = index < current
        const active = index === current

        return (
          <div key={step.field} className="flex items-center">
            {index > 0 && (
              <span
                className={`mx-1 h-px w-3 transition-colors duration-500 sm:mx-2 sm:w-6 ${
                  index <= current ? 'bg-[#e8a33d]' : 'bg-[#dfe1e5]'
                }`}
                aria-hidden="true"
              />
            )}
            <span
              className={`flex h-8 w-8 items-center justify-center rounded-full border text-[12px] font-semibold transition-all duration-300 ${
                complete || active
                  ? 'border-[#e8a33d] bg-[#e8a33d] text-white'
                  : 'border-[#d8dbe0] bg-white text-[#8c929c]'
              }`}
              aria-current={active ? 'step' : undefined}
            >
              {complete ? <Check className="h-4 w-4" strokeWidth={2.4} /> : index + 1}
            </span>
          </div>
        )
      })}
    </div>
  )
}

function Choice({ option, selected, onSelect, detailed = false }) {
  const Icon = option.icon

  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group flex w-full items-center gap-3 rounded-[8px] border px-3.5 py-3 text-left transition-[border-color,background-color,transform] duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8a33d] ${
        selected
          ? 'border-[#e8a33d] bg-[#fdf7ee]'
          : 'border-[#e1e3e7] bg-white hover:-translate-y-px hover:border-[#e6bd7a]'
      } ${
        detailed
          ? 'min-h-[88px] lg:min-h-[72px] lg:py-2'
          : 'min-h-[66px] lg:min-h-[60px] lg:py-2'
      }`}
      aria-pressed={selected}
    >
      <span
        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition-colors ${
          selected
            ? 'border-[#e8a33d] bg-[#e8a33d] text-white'
            : 'border-[#9ba1ab] bg-white text-transparent'
        }`}
      >
        <Check className="h-3 w-3" strokeWidth={2.6} />
      </span>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#f2f3f4] text-[#34383e]">
        <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-semibold text-[#17191c]">
          {option.title}
        </span>
        <span className="mt-0.5 block text-[11px] leading-4 text-[#767c86]">
          {option.description}
        </span>
        {option.detail && (
          <span className="mt-1 block text-[10px] leading-4 text-[#979ca4]">
            {option.detail}
          </span>
        )}
      </span>
    </button>
  )
}

function OnboardingFlow({ onFailure, onComplete }) {
  const [stepIndex, setStepIndex] = useState(0)
  const [answers, setAnswers] = useState(initialAnswers)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [showCreatingPlan, setShowCreatingPlan] = useState(false)

  const step = steps[stepIndex]
  const StepIcon = step.icon
  const isLastStep = stepIndex === steps.length - 1

  function selectOption(option) {
    setAnswers((current) => ({ ...current, [step.field]: option.value }))
  }

  async function finishOnboarding() {
    setIsSubmitting(true)
    setShowCreatingPlan(true)
    const startedAt = Date.now()

    try {
      await completeOnboarding(answers)
      const remainingDelay = Math.max(0, 700 - (Date.now() - startedAt))
      await new Promise((resolve) => window.setTimeout(resolve, remainingDelay))
      onComplete()
    } catch (error) {
      setShowCreatingPlan(false)
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

  return (
    <>
      <div className="flex min-h-[540px] w-full flex-col lg:min-h-[510px]">
      <header className="flex items-center">
        <button
          type="button"
          onClick={() => setStepIndex((current) => Math.max(0, current - 1))}
          disabled={stepIndex === 0 || isSubmitting}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[#555b64] transition-colors hover:bg-[#f2f3f4] disabled:invisible focus-visible:outline-2 focus-visible:outline-[#e8a33d]"
          aria-label="Previous step"
          title="Previous step"
        >
          <ArrowLeft className="h-4 w-4" strokeWidth={1.9} />
        </button>
        <Progress current={stepIndex} />
        <button
          type="button"
          onClick={continueFlow}
          disabled={isLastStep || isSubmitting}
          className="w-10 text-right text-[11px] font-medium text-[#7d838d] transition-colors hover:text-[#b27413] disabled:invisible focus-visible:outline-2 focus-visible:outline-[#e8a33d]"
        >
          Skip
        </button>
      </header>

      <section
        key={step.field}
        className="flex flex-1 animate-[onboarding-step-in_340ms_cubic-bezier(0.16,1,0.3,1)] flex-col pt-7 lg:pt-3"
      >
        <div className="text-center">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#f2f3f4] text-[#34383e] lg:h-11 lg:w-11">
            <StepIcon className="h-6 w-6" strokeWidth={1.65} aria-hidden="true" />
          </span>
          <p className="mt-4 text-[10px] font-semibold uppercase text-[#858a93] lg:mt-2">
            {step.eyebrow}
          </p>
          <h2 className="mt-1.5 text-[25px] font-semibold leading-tight text-[#111317]">
            {step.title}
          </h2>
          <p className="mx-auto mt-2 max-w-[390px] text-[12px] leading-5 text-[#7a808a]">
            {step.subtitle}
          </p>
        </div>

        <div className="mb-5 mt-6 lg:mb-4 lg:mt-4">
          <div className="space-y-2.5">
            {step.options.map((option) => (
              <Choice
                key={option.value}
                option={option}
                selected={answers[step.field] === option.value}
                onSelect={() => selectOption(option)}
                detailed={Boolean(option.detail)}
              />
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={continueFlow}
          disabled={isSubmitting}
          className="mt-auto flex h-12 w-full items-center justify-center gap-2 rounded-[8px] bg-[#e8a33d] text-[13px] font-semibold text-white transition-[background-color,transform] duration-200 hover:bg-[#d8922e] active:scale-[0.995] active:bg-[#bf7416] disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e8a33d]"
        >
          {isSubmitting ? (
            <>
              <LoaderCircle className="h-4 w-4 animate-spin" aria-hidden="true" />
              Creating your plan
            </>
          ) : (
            <>
              {isLastStep ? 'Finish' : 'Continue'}
              {isLastStep ? (
                <Check className="h-4 w-4" strokeWidth={2} />
              ) : (
                <ArrowRight className="h-4 w-4" strokeWidth={1.9} />
              )}
            </>
          )}
        </button>

        <div className="mt-5 flex justify-center gap-2 lg:mt-3" aria-hidden="true">
          {steps.map((item, index) => (
            <span
              key={item.field}
              className={`h-1.5 w-1.5 rounded-full transition-colors duration-300 ${
                index === stepIndex ? 'bg-[#e8a33d]' : 'bg-[#e2e4e7]'
              }`}
            />
          ))}
        </div>
      </section>
      </div>

      {showCreatingPlan && <CreatingPlanModal />}
    </>
  )
}

export default OnboardingFlow
