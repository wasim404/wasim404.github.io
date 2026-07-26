import { useState } from 'react'

const weekDays = ['一', '二', '三', '四', '五', '六', '日']

function isSameDate(dateA, dateB) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  )
}

function Calendar({ selectedDate, onSelectDate }) {
  // 控制当前显示哪个月份
  const [currentMonth, setCurrentMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
  )

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()

  // 当前月份有多少天
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // 当前月份第一天是星期几
  const firstDay = new Date(year, month, 1).getDay()

  // 把星期日开头转换为星期一开头
  const emptyDays = (firstDay + 6) % 7

  function showPreviousMonth() {
    setCurrentMonth(new Date(year, month - 1, 1))
  }

  function showNextMonth() {
    setCurrentMonth(new Date(year, month + 1, 1))
  }

  return (
    <div className="rounded-xl border border-slate-700 p-5">
      {/* 月份切换栏 */}
      <div className="mb-6 flex items-center justify-between">
        <button
          type="button"
          onClick={showPreviousMonth}
          className="rounded-lg px-3 py-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          ←
        </button>

        <h3 className="text-lg font-semibold">
          {year} 年 {month + 1} 月
        </h3>

        <button
          type="button"
          onClick={showNextMonth}
          className="rounded-lg px-3 py-2 text-slate-400 transition-colors hover:bg-slate-800 hover:text-white"
        >
          →
        </button>
      </div>

      {/* 星期标题 */}
      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-sm text-slate-500"
          >
            周{day}
          </div>
        ))}

        {/* 月份开头的空白格子 */}
        {Array.from({ length: emptyDays }).map((_, index) => (
          <div key={`empty-${index}`} />
        ))}

        {/* 日期按钮 */}
        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1
          const date = new Date(year, month, day)

          const isSelected = isSameDate(date, selectedDate)
          const isToday = isSameDate(date, new Date())

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDate(date)}
              className={`aspect-square rounded-lg text-sm transition-colors ${
                isSelected
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800'
              } ${isToday && !isSelected ? 'ring-1 ring-blue-500' : ''}`}
            >
              {day}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default Calendar