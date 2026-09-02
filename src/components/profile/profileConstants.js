export const GENDER_OPTIONS = [
  { value: 'male', label: '男' },
  { value: 'female', label: '女' },
  { value: 'other', label: '其他' },
  { value: 'prefer_not_to_say', label: '不愿透露' },
]

export function genderLabel(value) {
  return GENDER_OPTIONS.find((option) => option.value === value)?.label || '未设置'
}
