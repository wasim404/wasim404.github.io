import { useState } from 'react'
import Calendar from '../calendar/Calendar'

function SchedulePage() {
  const [selectedDate, setSelectedDate] = useState(new Date())
  return (
    <main className="min-h-screen  px-6 pb-8 pt-24">
      <div className="mx-auto max-w-6xl">
        {/* 页面标题 */}
        <header className="mb-8">
          <h1 className=" text-black text-3xl font-bold">日程安排</h1>
        </header>

        {/* 页面主体 */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* 日历区域 */}
          <section className="rounded-2xl p-6 lg:col-span-2">
            <h2 className="mb-4 text-xl font-semibold">日历</h2>

            <Calendar
              selectedDate={selectedDate}
              onSelectDate={setSelectedDate}
            />
          </section>

          {/* 任务区域 */}
          <aside className="rounded-2xl bg-slate-900 p-6">
            <h2 className="mb-4 text-xl font-semibold">{selectedDate.getMonth() + 1} 月 {selectedDate.getDate()} 日任务</h2>

            <div className="rounded-xl border border-dashed border-slate-700 p-6 text-center">
              <p className="text-sm text-slate-500">当前没有任务</p>

              <button className="mt-4 rounded-lg bg-blue-600 px-4 py-2 text-sm transition-colors hover:bg-blue-500">
                添加任务
              </button>
            </div>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default SchedulePage