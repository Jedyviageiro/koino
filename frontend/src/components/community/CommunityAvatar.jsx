function CommunityAvatar({ author, size = 'md' }) {
  const dimension = size === 'sm' ? 'h-7 w-7 text-[9px]' : 'h-9 w-9 text-[11px]'
  const initials = (author?.fullname || 'Koino Reader')
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()

  if (author?.profilePictureUrl) {
    return (
      <img
        src={author.profilePictureUrl}
        alt=""
        className={`${dimension} shrink-0 rounded-full object-cover`}
      />
    )
  }

  return (
    <span
      className={`${dimension} flex shrink-0 items-center justify-center rounded-full bg-[#f2eadf] font-semibold text-[#75572f]`}
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}

export default CommunityAvatar
