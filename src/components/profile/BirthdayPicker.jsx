export default function BirthdayPicker({ value, onChange, disabled }) {
  return (
    <label className="profile-field" htmlFor="profile-birthday">
      <span className="profile-field__label">
        <strong>生日</strong>
        <small className="profile-muted">可留空，以后仍可修改</small>
      </span>
      <input
        id="profile-birthday"
        className="profile-input w-full rounded-xl border border-[#526991]/20 bg-[#f9fafc] px-3.5 py-3 text-sm font-medium text-[#27334e] outline-none transition focus:border-[#5878c7] focus:ring-4 focus:ring-[#5878c7]/10 disabled:opacity-60"
        type="date"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
      />
    </label>
  )
}
