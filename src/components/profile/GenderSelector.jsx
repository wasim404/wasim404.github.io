import { GENDER_OPTIONS, genderLabel } from './profileConstants'

export default function GenderSelector({ gender, selectedGender, onSelect, onRequestConfirm, error }) {
  if (gender) {
    return (
      <section className="profile-section rounded-[22px] border border-[#384c7d]/10 bg-white/65 p-5 sm:p-6">
        <h3 className="m-0 text-sm font-bold text-[#33415f]">性别</h3>
        <p className="mt-2 text-base font-bold text-[#27334e]">{genderLabel(gender)}</p>
        <p className="profile-muted mt-2 text-xs text-[#7a849d]">设置后不可自行修改</p>
      </section>
    )
  }

  return (
    <fieldset className="profile-section rounded-[22px] border border-[#384c7d]/10 bg-white/65 p-5 sm:p-6">
      <legend className="text-sm font-bold text-[#33415f]">性别</legend>
      <p className="profile-muted mt-2 text-xs leading-5 text-[#7a849d]">仅可设置一次，确认后无法自行修改。</p>
      <div className="mt-4 grid grid-cols-2 gap-2" role="radiogroup" aria-label="选择性别">
        {GENDER_OPTIONS.map((option) => (
          <button
            type="button"
            role="radio"
            aria-checked={selectedGender === option.value}
            className={`rounded-xl border px-3 py-2.5 text-xs font-bold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5878c7] ${selectedGender === option.value ? 'border-[#5878c7] bg-[#eef3ff] text-[#4968b6]' : 'border-[#526991]/15 bg-[#f9fafc] text-[#69758d] hover:border-[#5878c7]/45'}`}
            onClick={() => onSelect(option.value)}
            key={option.value}
          >
            {option.label}
          </button>
        ))}
      </div>
      <button
        type="button"
        className="mt-4 w-full rounded-xl border border-[#5878c7]/20 bg-[#edf1f8] px-4 py-2.5 text-xs font-bold text-[#425477] hover:bg-[#e3e9f4] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#5878c7] disabled:cursor-not-allowed disabled:opacity-45"
        disabled={!selectedGender}
        onClick={onRequestConfirm}
      >
        确认性别设置
      </button>
      {error && <p className="mt-3 text-xs text-[#a44f48]" role="alert">{error}</p>}
    </fieldset>
  )
}
