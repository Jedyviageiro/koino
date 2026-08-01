import { CalendarDays, Heart } from 'lucide-react'
import BrandMark from '@/components/common/BrandMark.jsx'
import mobileNoticeArt from '@/assets/images/koino-mobile-notice-art.svg'
import { useTranslation } from 'react-i18next'

function MobileExperienceGate() {
  const { t } = useTranslation()
  return (
    <main className="mobile-gate">
      <div className="mobile-gate__content">
        <BrandMark
          className="mobile-gate__brand"
          iconClassName="h-10 w-10"
        />

        <img
          src={mobileNoticeArt}
          alt="Koino desktop experience"
          className="mobile-gate__art"
        />

        <p className="mobile-gate__eyebrow">{t('mobile.eyebrow')}</p>
        <h1>{t('mobile.title')}</h1>
        <div className="mobile-gate__rule" aria-hidden="true" />
        <p className="mobile-gate__message">
          {t('mobile.message')}
        </p>

        <section className="mobile-gate__notice">
          <span className="mobile-gate__notice-icon" aria-hidden="true">
            <CalendarDays size={25} strokeWidth={1.7} />
          </span>
          <div>
            <strong>{t('mobile.coming')}</strong>
            <p>{t('mobile.comingMessage')}</p>
          </div>
        </section>
      </div>

      <footer className="mobile-gate__footer">
        <Heart size={20} strokeWidth={1.5} aria-hidden="true" />
        <span>{t('mobile.thanks')}</span>
      </footer>
    </main>
  )
}

export default MobileExperienceGate
