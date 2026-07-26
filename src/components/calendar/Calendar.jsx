import { useState } from 'react'

const weekDays = ['一', '二', '三', '四', '五', '六', '日']

function isSameDate(dateA, dateB) {
  return (
    dateA.getFullYear() === dateB.getFullYear() &&
    dateA.getMonth() === dateB.getMonth() &&
    dateA.getDate() === dateB.getDate()
  )
}

function Calendar({ selectedDate, onSelectDate, hasTasksForDate }) {
  const [currentMonth, setCurrentMonth] = useState(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1),
  )

  const year = currentMonth.getFullYear()
  const month = currentMonth.getMonth()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const firstDay = new Date(year, month, 1).getDay()
  const emptyDays = (firstDay + 6) % 7

  function showPreviousMonth() {
    setCurrentMonth(new Date(year, month - 1, 1))
  }

  function showNextMonth() {
    setCurrentMonth(new Date(year, month + 1, 1))
  }

  return (
    <div className="px-1 py-2 sm:px-3">
      <div className="mb-7 flex items-center justify-between">
        <button
          type="button"
          onClick={showPreviousMonth}
          aria-label="上个月"
          className="grid h-10 w-10 place-items-center rounded-full text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
        >
          ‹
        </button>

        <h3 className="text-lg font-semibold tracking-tight text-slate-900">
          {year} 年 {month + 1} 月
        </h3>

        <button
          type="button"
          onClick={showNextMonth}
          aria-label="下个月"
          className="grid h-10 w-10 place-items-center rounded-full text-xl text-slate-400 transition hover:bg-slate-100 hover:text-slate-900"
        >
          ›
        </button>
      </div>

      <div className="grid grid-cols-7 gap-2">
        {weekDays.map((day) => (
          <div
            key={day}
            className="py-2 text-center text-sm font-normal text-slate-500"
          >
            周{day}
          </div>
        ))}

        {Array.from({ length: emptyDays }).map((_, index) => (
          <div key={`empty-${index}`} />
        ))}

        {Array.from({ length: daysInMonth }).map((_, index) => {
          const day = index + 1
          const date = new Date(year, month, day)
          const isSelected = isSameDate(date, selectedDate)
          const isToday = isSameDate(date, new Date())
          const hasTasks = hasTasksForDate?.(date)

          return (
            <button
              key={day}
              type="button"
              onClick={() => onSelectDate(date)}
              aria-label={`${year}年${month + 1}月${day}日${hasTasks ? '，有任务' : ''}`}
              className={`relative aspect-square rounded-xl text-sm font-medium transition-all duration-200 ${
                isSelected
                  ? 'bg-slate-900 text-white shadow-md shadow-slate-900/20'
                  : 'text-slate-800 hover:bg-slate-100'
              } ${
                isToday && !isSelected
                  ? 'ring-1 ring-inset ring-blue-500'
                  : ''
              }`}
            >
              {day}
              {hasTasks && (
                <span
                  className={`absolute bottom-1.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full ${
                    isSelected ? 'bg-white' : 'bg-blue-500'
                  }`}
                />
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default Calendar
