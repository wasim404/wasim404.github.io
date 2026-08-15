function DataMigrationPrompt({ isWorking, error, onMerge, onLater }) {
  return (
    <div className="data-migration-backdrop">
      <section className="data-migration-card" role="dialog" aria-modal="true" aria-labelledby="migration-title">
        <span className="data-migration-card__mark" aria-hidden="true">↥</span>
        <p className="auth-card__eyebrow">FOUND LOCAL DATA</p>
        <h2 id="migration-title">把这台设备的数据带到账户里？</h2>
        <p>检测到尚未同步的任务或专注记录。合并后不会覆盖账户里已有内容，同一账号在其他设备登录也能看到。</p>
        {error && <p className="auth-form__error" role="alert">{error}</p>}
        <div>
          <button type="button" onClick={onMerge} disabled={isWorking}>{isWorking ? '正在安全合并…' : '合并并开启同步'}</button>
          <button type="button" onClick={onLater} disabled={isWorking}>稍后再说</button>
        </div>
        <small>本机数据会保留，合并成功后也不会被删除。</small>
      </section>
    </div>
  )
}

export default DataMigrationPrompt
