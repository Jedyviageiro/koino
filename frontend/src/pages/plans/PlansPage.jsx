import { useEffect, useMemo, useState } from 'react'
import HomeSidebar from '@/components/home/HomeSidebar.jsx'
import CurrentPlanCard from '@/components/plans/CurrentPlanCard.jsx'
import PlanRouteItem from '@/components/plans/PlanRouteItem.jsx'
import StatusModal from '@/components/auth/shared/StatusModal.jsx'
import { getAuthSession, getAuthToken } from '@/features/auth/authStorage.js'
import { getPlansPageData } from '@/features/plans/plansService.js'

function PlansPage({ onNavigate }) {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const session = getAuthSession()

  useEffect(() => {
    if (!getAuthToken()) {
      onNavigate('/')
      return
    }

    let active = true
    getPlansPageData()
      .then((plansData) => {
        if (active) setData(plansData)
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError.message || 'Unable to load your plans.')
        }
      })

    return () => {
      active = false
    }
  }, [onNavigate])

  const currentPlan = useMemo(
    () => data?.userPlans.find((plan) => !plan.completed) || null,
    [data],
  )
  const currentTemplate = useMemo(
    () =>
      data?.route.find((template) => template.planCode === currentPlan?.planCode) ||
      null,
    [currentPlan, data],
  )

  const otherPlans = useMemo(() => {
    if (!data) return []
    const plansByCode = new Map(
      data.userPlans.map((plan) => [plan.planCode, plan]),
    )

    return data.route
      .map((template, index) => ({
        template,
        index,
        existingPlan: plansByCode.get(template.planCode),
      }))
      .filter(({ template }) => template.planCode !== currentPlan?.planCode)
  }, [currentPlan, data])

  const firstUpcomingPlanIndex = useMemo(
    () =>
      otherPlans.findIndex(({ existingPlan }) => !existingPlan?.completed),
    [otherPlans],
  )

  const visiblePlans = useMemo(() => {
    if (firstUpcomingPlanIndex < 0) return otherPlans
    return otherPlans.slice(0, firstUpcomingPlanIndex + 1)
  }, [firstUpcomingPlanIndex, otherPlans])

  const concealedPlanCount =
    firstUpcomingPlanIndex < 0
      ? 0
      : Math.max(0, otherPlans.length - firstUpcomingPlanIndex - 1)

  return (
    <div className="min-h-svh bg-[#fbfcfe] text-[#0d0f12] lg:grid lg:grid-cols-[150px_minmax(0,1fr)]">
      <HomeSidebar
        name={session?.fullname || 'Koino Reader'}
        onNavigate={onNavigate}
        activePath="/plans"
      />

      <main className="min-w-0 px-[18px] pb-14 pt-7 sm:px-7 lg:px-9 lg:pt-9">
        <div className="mx-auto max-w-[1100px]">
          <header>
            <h1 className="text-[30px] font-semibold leading-tight">Plans</h1>
            <p className="mt-2 text-[14px] text-[#667089]">
              Stay consistent with God&apos;s Word through intentional reading plans.
            </p>
          </header>

          <section className="mt-8">
            <h2 className="mb-3 text-[14px] font-semibold">My Current Plan</h2>
            {data ? (
              <CurrentPlanCard
                plan={currentPlan}
                template={currentTemplate}
                todayTask={data.todayTask}
                onContinue={() => onNavigate('/reading')}
              />
            ) : (
              <div className="rounded-[8px] border border-[#dfe3e9] bg-white p-6">
                <div className="auth-skeleton h-6 w-48 rounded-[6px]" />
                <div className="auth-skeleton mt-5 h-16 w-full rounded-[6px]" />
              </div>
            )}
          </section>

          <section className="mt-7">
            <h2 className="mb-3 text-[14px] font-semibold">Your Reading Route</h2>
            <div className="space-y-2.5">
              {data
                ? visiblePlans.map(({ template, index, existingPlan }) => (
                    <PlanRouteItem
                      key={template.planCode}
                      template={template}
                      existingPlan={existingPlan}
                      dependencyName={
                        data.route[Math.max(0, index - 1)]?.name || currentPlan?.name
                      }
                    />
                  ))
                : Array.from({ length: 4 }, (_, index) => (
                    <div
                      key={index}
                      className="auth-skeleton h-[78px] rounded-[8px]"
                    />
                  ))}
            </div>
            {data && concealedPlanCount > 0 && (
              <div className="relative mt-2.5 h-[118px] overflow-hidden" aria-label="Additional locked plans">
                <div className="absolute inset-x-0 top-0 h-[70px] rounded-[8px] border border-[#e9e6e0] bg-white opacity-70 blur-[1.5px]" />
                <div className="absolute inset-x-4 top-11 h-[64px] rounded-[8px] border border-[#efede9] bg-white opacity-40 blur-[3px]" />
                <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(180deg,rgba(251,252,254,0.18)_0%,rgba(251,252,254,0.92)_58%,#fbfcfe_100%)]">
                  <p className="mt-7 text-[12px] font-medium text-[#77746e]">
                    More plans will be revealed as you progress
                  </p>
                </div>
              </div>
            )}
          </section>
        </div>
      </main>

      {error && (
        <StatusModal
          type="error"
          title="Plans unavailable"
          message={error}
          onClose={() => {
            setError('')
            onNavigate('/home')
          }}
        />
      )}
    </div>
  )
}

export default PlansPage
