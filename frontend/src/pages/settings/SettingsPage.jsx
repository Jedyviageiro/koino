import { useEffect, useState } from 'react'
import { Copy, ExternalLink, LoaderCircle } from 'lucide-react'
import StatusModal from '@/components/auth/shared/StatusModal.jsx'
import ModalShell from '@/components/common/ModalShell.jsx'
import { AppPageLayout, PageHeader } from '@/components/common/AppPageLayout.jsx'
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
    username: '',
    bio: '',
    location: '',
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
    <AppPageLayout
      name={form.fullname}
      onNavigate={onNavigate}
      activePath="/settings"
    >
          <PageHeader
            title="Settings"
            subtitle="Manage your profile and account information."
          />

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
                <label className="text-[11px] font-medium">
                  About You
                  <textarea
                    name="bio"
                    value={form.bio || ''}
                    onChange={changeField}
                    maxLength={280}
                    rows={3}
                    placeholder="Share a little about your faith journey."
                    className="mt-2 min-h-[88px] w-full resize-none rounded-[7px] border border-[#dfe3e8] bg-white px-3.5 py-3 text-[12px] font-normal leading-5 outline-none transition-colors focus:border-[#e8a33d]"
                  />
                </label>
                <label className="text-[11px] font-medium">
                  Location
                  <input
                    name="location"
                    value={form.location || ''}
                    onChange={changeField}
                    maxLength={100}
                    placeholder="City, country"
                    className="mt-2 h-11 w-full rounded-[7px] border border-[#dfe3e8] bg-white px-3.5 text-[12px] font-normal outline-none transition-colors focus:border-[#e8a33d]"
                  />
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

          {!loading && form.username && (
            <section className="mt-5 rounded-[8px] border border-[#dfe3e8] bg-white px-6 py-5">
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                  <h2 className="font-sans text-[13px] font-semibold">
                    Your public profile
                  </h2>
                  <p className="mt-1.5 text-[10px] leading-5 text-[#6d7584]">
                    Share this private-to-you link directly. Koino does not
                    provide a people search.
                  </p>
                  <p className="mt-2 break-all text-[9px] font-medium text-[#9a671d]">
                    {window.location.origin}/u/{form.username}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      onNavigate(`/u/${form.username}`)
                    }
                    className="flex h-10 items-center gap-2 rounded-[7px] border border-[#dfe3e8] px-3 text-[9px] font-semibold"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    View
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      await navigator.clipboard.writeText(
                        `${window.location.origin}/u/${form.username}`,
                      )
                      setStatus({
                        type: 'success',
                        title: 'Profile link copied',
                        message: 'Your public profile link is ready to share.',
                      })
                    }}
                    className="flex h-10 items-center gap-2 rounded-[7px] bg-[#e8a33d] px-3 text-[9px] font-semibold text-white"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    Copy link
                  </button>
                </div>
              </div>
            </section>
          )}

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
    </AppPageLayout>
  )
}

export default SettingsPage
