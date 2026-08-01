import ModalShell from '@/components/common/ModalShell.jsx'
import { useTranslation } from 'react-i18next'

function CreatingPlanModal() {
  const { t } = useTranslation()
  return (
    <ModalShell
      labelledBy="creating-plan-title"
      describedBy="creating-plan-message"
      dismissible={false}
    >
      <div className="flex h-full flex-col items-center justify-center px-8">
        <p className="text-[10px] font-semibold uppercase text-[#b27413]">
          {t('onboardingModal.personalized')}
        </p>
        <h2
          id="creating-plan-title"
          className="mt-3 text-[22px] font-semibold text-[#17191c]"
        >
          {t('onboardingModal.title')}
        </h2>
        <p
          id="creating-plan-message"
          className="mx-auto mt-2 max-w-[270px] text-[11px] leading-[1.65] text-[#747880]"
        >
          {t('onboardingModal.message')}
        </p>

        <div
          className="mt-8 h-1.5 w-full overflow-hidden rounded-full bg-[#eee9e1]"
          role="progressbar"
          aria-label={t('onboardingModal.progress')}
        >
          <span className="plan-processing-line block h-full w-2/5 rounded-full bg-[#e8a33d]" />
        </div>
        <p className="mt-3 text-[10px] text-[#96918a]">
          {t('onboardingModal.preparing')}
        </p>
      </div>
    </ModalShell>
  )
}

export default CreatingPlanModal
