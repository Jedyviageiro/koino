import { useEffect, useState } from 'react'
import { LoaderCircle } from 'lucide-react'
import StatusModal from '@/components/auth/shared/StatusModal.jsx'
import ModalShell from '@/components/common/ModalShell.jsx'
import HomeSidebar from '@/components/home/HomeSidebar.jsx'
import {
  clearAuthSession,
  getAuthSession,
  getAuthToken,
  updateAuthSession,
} from '@/features/auth/authStorage.js'
import {
  deactivateAccount,
  getSettings,
  updateSettings,
} from '@/features/settings/settingsService.js'

const timeZones = [
  { value: 'Africa/Maputo', label: '(GMT+02:00) Maputo' },
  { value: 'Africa/Johannesburg', label: '(GMT+02:00) Johannesburg' },
  { value: 'Europe/London', label: '(GMT+00:00) London' },
  { value: 'America/New_York', label: '(GMT-05:00) New York' },
]

const languages = [
  { value: 'en', label: 'English' },
  { value: 'pt', label: 'Portuguese' },
]

function SettingsPage({ onNavigate }) {
  const session = getAuthSession()
  const [form, setForm] = useState({
    fullname: session?.fullname || '',
    email: session?.email || '',
    timeZone: 'Africa/Maputo',
    language: 'en',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deactivating, setDeactivating] = useState(false)
  const [confirmDeactivate, setConfirmDeactivate] = useState(false)
  const [status, setStatus] = useState(null)

  useEffect(() => {
    if (!getAuthToken()) {
      onNavigate('/')
      return
    }

    let active = true
    getSettings()
      .then((settings) => {
        if (active) setForm(settings)
      })
      .catch((error) => {
        if (active) {
          setStatus({
            type: 'error',
            title: 'Settings unavailable',
            message: error.message || 'Unable to load your settings.',
          })
        }
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => {
      active = false
    }
  }, [onNavigate])

  function changeField(event) {
    const { name, value } = event.target
    setForm((current) => ({ ...current, [name]: value }))
  }

  async function save(event) {
    event.preventDefault()
    setSaving(true)
    try {
      const updated = await updateSettings(form)
      setForm(updated)
      updateAuthSession({
        fullname: updated.fullname,
        email: updated.email,
        profilePictureUrl: updated.profilePictureUrl,
      })
      setStatus({
        type: 'success',
        title: 'Settings saved',
        message: 'Your profile and account preferences are up to date.',
      })
    } catch (error) {
      setStatus({
        type: 'error',
        title: 'Could not save settings',
        message: error.message || 'Please review your details and try again.',
      })
    } finally {
      setSaving(false)
    }
  }

  async function deactivate() {
    setDeactivating(true)
    try {
      await deactivateAccount()
      clearAuthSession()
      onNavigate('/')
    } catch (error) {
      setConfirmDeactivate(false)
      setStatus({
        type: 'error',
        title: 'Could not deactivate account',
        message: error.message || 'Please try again shortly.',
      })
    } finally {
      setDeactivating(false)
    }
  }

  return (
    <div className="min-h-svh bg-[#fbfcfe] text-[#0d0f12] lg:grid lg:grid-cols-[164px_minmax(0,1fr)]">
      <HomeSidebar
        name={form.fullname}
        onNavigate={onNavigate}
        activePath="/settings"
      />

      <main className="min-w-0 px-[18px] pb-12 pt-7 sm:px-7 lg:px-8 lg:pt-8">
        <div className="mx-auto max-w-[1040px]">
          <header className="mb-6">
            <h1 className="text-[30px] font-semibold leading-tight">Settings</h1>
            <p className="mt-1.5 text-[13px] text-[#667089]">
              Manage your profile and account information.
            </p>
          </header>

          <form
            onSubmit={save}
            className="rounded-[8px] border border-[#dfe3e8] bg-white px-6 py-6"
          >
            <h2 className="font-sans text-[15px] font-semibold">
              Profile Information
            </h2>
            <p className="mt-1 text-[11px] text-[#6d7584]">
              Update your personal information.
            </p>

            {loading ? (
              <div className="mt-6 space-y-5">
                {Array.from({ length: 4 }, (_, index) => (
                  <div key={index}>
                    <div className="auth-skeleton h-3 w-24 rounded" />
                    <div className="auth-skeleton mt-2 h-11 w-full rounded-[7px]" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-6 grid gap-5">
                <label className="text-[11px] font-medium">
                  Full Name
                  <input
                    name="fullname"
                    value={form.fullname}
                    onChange={changeField}
                    minLength={2}
                    maxLength={120}
                    required
                    className="mt-2 h-11 w-full rounded-[7px] border border-[#dfe3e8] bg-white px-3.5 text-[12px] font-normal outline-none transition-colors focus:border-[#e8a33d]"
                  />
                </label>
                <label className="text-[11px] font-medium">
                  Email
                  <input
                    name="email"
                    type="email"
                    value={form.email}
                    onChange={changeField}
                    maxLength={254}
                    required
                    className="mt-2 h-11 w-full rounded-[7px] border border-[#dfe3e8] bg-white px-3.5 text-[12px] font-normal outline-none transition-colors focus:border-[#e8a33d]"
                  />
                </label>
                <label className="text-[11px] font-medium">
                  Time Zone
                  <select
                    name="timeZone"
                    value={form.timeZone}
                    onChange={changeField}
                    className="mt-2 h-11 w-full rounded-[7px] border border-[#dfe3e8] bg-white px-3.5 text-[12px] font-normal outline-none transition-colors focus:border-[#e8a33d]"
                  >
                    {timeZones.map((zone) => (
                      <option key={zone.value} value={zone.value}>
                        {zone.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-[11px] font-medium">
                  Language
                  <select
                    name="language"
                    value={form.language}
                    onChange={changeField}
                    className="mt-2 h-11 w-full rounded-[7px] border border-[#dfe3e8] bg-white px-3.5 text-[12px] font-normal outline-none transition-colors focus:border-[#e8a33d]"
                  >
                    {languages.map((language) => (
                      <option key={language.value} value={language.value}>
                        {language.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            )}

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={loading || saving}
                className="flex h-11 min-w-[145px] items-center justify-center gap-2 rounded-[7px] bg-[#e8a33d] px-5 text-[11px] font-semibold text-white transition-colors hover:bg-[#d8922e] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {saving && <LoaderCircle className="h-4 w-4 animate-spin" />}
                {saving ? 'Saving' : 'Save Changes'}
              </button>
            </div>
          </form>

          <section className="mt-5 flex items-center justify-between gap-6 rounded-[8px] border border-[#eadfdf] bg-white px-6 py-5">
            <div>
              <h2 className="font-sans text-[13px] font-semibold text-[#c73434]">
                Deactivate Account
              </h2>
              <p className="mt-1.5 text-[10px] leading-5 text-[#6d7584]">
                This disables your account and signs you out immediately.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setConfirmDeactivate(true)}
              className="h-11 shrink-0 rounded-[7px] border border-[#df4b4b] px-6 text-[11px] font-semibold text-[#c73434] hover:bg-[#fff7f7]"
            >
              Deactivate Account
            </button>
          </section>
        </div>
      </main>

      {confirmDeactivate && (
        <ModalShell
          labelledBy="deactivate-title"
          describedBy="deactivate-message"
          onClose={() => setConfirmDeactivate(false)}
        >
          <div className="flex h-full flex-col px-7 pb-7 pt-8 text-left">
            <h2 id="deactivate-title" className="text-[21px] font-semibold">
              Deactivate your account?
            </h2>
            <p
              id="deactivate-message"
              className="mt-3 text-[11px] leading-5 text-[#6d7584]"
            >
              You will be signed out and will no longer be able to access your
              Koino account.
            </p>
            <div className="mt-auto grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setConfirmDeactivate(false)}
                disabled={deactivating}
                className="h-11 rounded-[7px] border border-[#dfe3e8] text-[11px] font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={deactivate}
                disabled={deactivating}
                className="h-11 rounded-[7px] bg-[#c73434] text-[11px] font-semibold text-white disabled:opacity-60"
              >
                {deactivating ? 'Deactivating' : 'Deactivate'}
              </button>
            </div>
          </div>
        </ModalShell>
      )}

      {status && (
        <StatusModal
          type={status.type}
          title={status.title}
          message={status.message}
          autoCloseMs={status.type === 'success' ? 1500 : undefined}
          onClose={() => setStatus(null)}
        />
      )}
    </div>
  )
}

export default SettingsPage
