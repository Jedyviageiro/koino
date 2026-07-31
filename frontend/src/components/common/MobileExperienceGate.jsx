import { CalendarDays, Heart, Monitor, Smartphone } from 'lucide-react'
import BrandMark from '@/components/common/BrandMark.jsx'

function MobileExperienceGate() {
  return (
    <main className="mobile-gate">
      <div className="mobile-gate__content">
        <BrandMark
          className="mobile-gate__brand"
          iconClassName="h-10 w-10"
        />

        <div className="mobile-gate__devices" aria-hidden="true">
          <div className="mobile-gate__monitor">
            <Monitor size={92} strokeWidth={1.25} />
            <span className="mobile-gate__device-logo">Koino</span>
          </div>
          <div className="mobile-gate__phone">
            <Smartphone size={58} strokeWidth={1.3} />
            <span className="mobile-gate__blocked-line" />
          </div>
        </div>

        <p className="mobile-gate__eyebrow">Desktop experience required</p>
        <h1>Koino isn&apos;t available on mobile yet.</h1>
        <div className="mobile-gate__rule" aria-hidden="true" />
        <p className="mobile-gate__message">
          We&apos;re crafting the best possible experience for you. For now,
          please use a tablet, laptop, or desktop.
        </p>

        <section className="mobile-gate__notice">
          <span className="mobile-gate__notice-icon" aria-hidden="true">
            <CalendarDays size={25} strokeWidth={1.7} />
          </span>
          <div>
            <strong>Coming soon</strong>
            <p>We&apos;re working to bring Koino to your mobile device.</p>
          </div>
        </section>
      </div>

      <footer className="mobile-gate__footer">
        <Heart size={20} strokeWidth={1.5} aria-hidden="true" />
        <span>Thank you for your understanding</span>
      </footer>
    </main>
  )
}

export default MobileExperienceGate
