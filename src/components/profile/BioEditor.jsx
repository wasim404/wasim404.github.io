export default function BioEditor({ value, onChange, disabled }) {
  const length = [...value].length
  const isTooLong = length > 30

  return (
    <label className="grid gap-2 text-sm font-bold text-[#33415f]" htmlFor="profile-bio">
      个性签名
      <textarea
        id="profile-bio"
        className="profile-input min-h-24 w-full resize-none rounded-xl border border-[#526991]/20 bg-[#f9fafc] px-3.5 py-3 text-sm font-medium leading-6 text-[#27334e] outline-none transition focus:border-[#5878c7] focus:ring-4 focus:ring-[#5878c7]/10 disabled:opacity-60"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={isTooLong}
        aria-describedby="profile-bio-count"
        placeholder="写下一句介绍自己或鼓励自己的话"
        disabled={disabled}
      />
      <span
        id="profile-bio-count"
        className={`justify-self-end text-[11px] font-semibold ${isTooLong ? 'text-[#a44f48]' : 'profile-muted text-[#8992a7]'}`}
      >
        {length} / 30{isTooLong ? '，请删减后再保存' : ''}
      </span>
    </label>
  )
}
