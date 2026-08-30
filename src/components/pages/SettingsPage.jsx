import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'
import { Link } from 'react-router-dom'
import './SettingsPage.css'
import {
  applyFontSizePreference,
  applyThemePreference,
  FONT_SIZE_OPTIONS,
  getFontSizeOption,
  readFontSizePreference,
  readThemePreference,
} from '../../services/displayPreferences'

const settingGroups = [
  {
    id: 'account',
    eyebrow: 'ACCOUNT',
    title: '用户账号设置',
    description: '集中管理你的个人资料、账号安全与数据。',
    icon: '◎',
    items: [
      { title: '个人资料', detail: '头像、昵称和个人信息' },
      { title: '账号与安全', detail: '登录方式、密码和安全验证' },
      { title: '数据管理', detail: '数据同步、导出与账号数据' },
    ],
  },
  {
    id: 'preferences',
    eyebrow: 'PREFERENCES',
    title: '用户使用偏好设置',
    description: '按你的习惯调整 MANOONG 的使用体验。',
    icon: '◇',
    items: [
      { title: '通知与提醒', detail: '日程、专注和每日回顾提醒' },
      {
        title: '外观与显示',
        detail: '主题、字体与页面显示方式',
        action: 'appearance',
      },
      { title: '专注与日程偏好', detail: '默认时长、目标和工作习惯' },
    ],
  },
]

const THEME_OPTIONS = [
  {
    id: 'light',
    label: '浅色模式',
    detail: '浅色背景与深色文字',
    icon: '☀',
  },
  {
    id: 'dark',
    label: '深色模式',
    detail: '黑色背景与白色文字',
    icon: '☾',
  },
]

function AppearanceDialog({ fontSizeId, theme, onApply, onClose }) {
  const [draftFontSizeId, setDraftFontSizeId] = useState(fontSizeId)
  const [draftTheme, setDraftTheme] = useState(theme)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow

    function closeOnEscape(event) {
      if (event.key === 'Escape') onClose()
    }

    document.body.style.overflow = 'hidden'
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [onClose])

  return createPortal(
    <div
      className="appearance-dialog-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <section
        className="appearance-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="appearance-dialog-title"
      >
        <header className="appearance-dialog__header">
          <div>
            <p>APPEARANCE</p>
            <h2 id="appearance-dialog-title">外观与显示</h2>
          </div>
          <button type="button" onClick={onClose} aria-label="关闭外观与显示设置">
            ×
          </button>
        </header>

        <fieldset className="font-size-setting">
          <legend>
            <span>全局字号</span>
            <small>将在所有页面生效</small>
          </legend>
          <div className="font-size-options" role="radiogroup" aria-label="选择全局字号">
            {FONT_SIZE_OPTIONS.map((option) => {
              const isSelected = option.id === draftFontSizeId
              return (
                <button
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={isSelected ? 'is-selected' : ''}
                  onClick={() => setDraftFontSizeId(option.id)}
                  key={option.id}
                >
                  <strong style={{ fontSize: `${option.previewSize}px` }}>Aa</strong>
                  <span>{option.label}</span>
                  <i aria-hidden="true">{isSelected ? '✓' : ''}</i>
                </button>
              )
            })}
          </div>
        </fieldset>

        <div
          className="font-size-preview"
          style={{
            '--preview-font-scale': getFontSizeOption(draftFontSizeId).scale,
          }}
          aria-live="polite"
        >
          <span>字号预览</span>
          <strong>让时间被看见，让每一天都有迹可循。</strong>
        </div>

        <fieldset className="display-mode-setting">
          <legend>
            <span>显示模式</span>
            <small>将在所有页面生效</small>
          </legend>
          <div className="display-mode-options" role="radiogroup" aria-label="选择显示模式">
            {THEME_OPTIONS.map((option) => {
              const isSelected = option.id === draftTheme
              return (
                <button
                  type="button"
                  role="radio"
                  aria-checked={isSelected}
                  className={isSelected ? 'is-selected' : ''}
                  onClick={() => setDraftTheme(option.id)}
                  key={option.id}
                >
                  <i aria-hidden="true">{option.icon}</i>
                  <span>
                    <strong>{option.label}</strong>
                    <small>{option.detail}</small>
                  </span>
                  <b aria-hidden="true">{isSelected ? '✓' : ''}</b>
                </button>
              )
            })}
          </div>
        </fieldset>

        <footer className="appearance-dialog__footer">
          <button
            type="button"
            onClick={() => {
              onApply(draftFontSizeId, draftTheme)
              onClose()
            }}
          >
            应用
          </button>
        </footer>
      </section>
    </div>,
    document.body,
  )
}

function SettingsPage() {
  const [fontSizeId, setFontSizeId] = useState(readFontSizePreference)
  const [theme, setTheme] = useState(readThemePreference)
  const [isAppearanceOpen, setIsAppearanceOpen] = useState(false)

  function applyAppearance(nextFontSizeId, nextTheme) {
    setFontSizeId(applyFontSizePreference(nextFontSizeId))
    setTheme(applyThemePreference(nextTheme))
  }

  return (
    <>
      <main className="settings-page">
        <div className="settings-page__wash settings-page__wash--one" />
        <div className="settings-page__wash settings-page__wash--two" />

        <div className="settings-shell">
          <header className="settings-hero">
            <div>
              <p>SETTINGS</p>
              <h1>设置</h1>
              <span>这里将成为你管理账号与个性化体验的地方。</span>
            </div>
            <Link to="/about/statistics">
              查看数据统计 <span aria-hidden="true">→</span>
            </Link>
          </header>

          <div className="settings-groups">
            {settingGroups.map((group) => (
              <section className="settings-group" key={group.id}>
                <header className="settings-group__header">
                  <span className="settings-group__icon" aria-hidden="true">
                    {group.icon}
                  </span>
                  <div>
                    <p>{group.eyebrow}</p>
                    <h2>{group.title}</h2>
                    <span>{group.description}</span>
                  </div>
                </header>

                <div className="settings-list">
                  {group.items.map((item) => {
                    const itemContent = (
                      <>
                        <div>
                          <h3>{item.title}</h3>
                          <p>{item.detail}</p>
                        </div>
                        <span>
                          {item.action === 'appearance'
                            ? `${getFontSizeOption(fontSizeId).label} · ${
                                theme === 'dark' ? '深色' : '浅色'
                              }`
                            : '即将开放'}
                          {item.action === 'appearance' && <b aria-hidden="true">→</b>}
                        </span>
                      </>
                    )

                    return item.action === 'appearance' ? (
                      <button
                        type="button"
                        className="settings-item settings-item--action"
                        onClick={() => setIsAppearanceOpen(true)}
                        aria-haspopup="dialog"
                        key={item.title}
                      >
                        {itemContent}
                      </button>
                    ) : (
                      <article className="settings-item" key={item.title}>
                        {itemContent}
                      </article>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>

          <aside className="settings-roadmap">
            <span aria-hidden="true">＋</span>
            <div>
              <strong>为未来功能预留</strong>
              <p>更多设置项会随着功能完善逐步加入，这里的结构也会持续扩展。</p>
            </div>
          </aside>
        </div>
      </main>

      {isAppearanceOpen && (
        <AppearanceDialog
          fontSizeId={fontSizeId}
          theme={theme}
          onApply={applyAppearance}
          onClose={() => setIsAppearanceOpen(false)}
        />
      )}
    </>
  )
}

export default SettingsPage
