export default function BirthdayPicker({ value, onChange, disabled }) {
  return (
    <label className="grid gap-2 text-sm font-bold text-[#33415f]" htmlFor="profile-birthday">
      生日
      <input
        id="profile-birthday"
        className="profile-input w-full rounded-xl border border-[#526991]/20 bg-[#f9fafc] px-3.5 py-3 text-sm font-medium text-[#27334e] outline-none transition focus:border-[#5878c7] focus:ring-4 focus:ring-[#5878c7]/10 disabled:opacity-60"
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
      <span className="profile-muted text-[11px] font-normal text-[#8992a7]">可留空，以后仍可修改</span>
    </label>
  )
}
