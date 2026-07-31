import koinoLogo from '@/assets/images/koino-logo.svg'

function BrandMark({ className = '', iconClassName = 'h-7 w-7' }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <img
        src={koinoLogo}
        alt=""
        className={`${iconClassName} shrink-0 object-contain`}
      />
      <span className="font-sans text-[18px] font-semibold text-black">
        Koino
      </span>
    </span>
  )
}

export default BrandMark
