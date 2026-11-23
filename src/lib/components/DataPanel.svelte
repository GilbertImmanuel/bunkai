<script lang="ts">
  import { tick } from 'svelte'
  import type { Session } from '../data/types'
  import {
    BackupError,
    MAX_BACKUP_BYTES,
    backupFilename,
    createBackup,
    parseBackup,
    serializeBackup,
    type BackupFile,
  } from '../data/backup'
  import { closeAiSettings } from '../stores/ai.svelte'
  import { goHome } from '../stores/app.svelte'
  import { historyState, importSessions, type ImportMode } from '../stores/history.svelte'
  import { showToast } from '../stores/toast.svelte'

  let fileInput: HTMLInputElement | undefined = $state()
  let selectedFileName = $state('')
  let parsed = $state<BackupFile | null>(null)
  let error = $state('')
  let importing = $state(false)
  let mode = $state<ImportMode>('merge')
  let replaceConfirmed = $state(false)

  const sessionCount = $derived(historyState.sessions.length)
  const importCount = $derived(parsed?.sessions.length ?? 0)
  const canImport = $derived(
    Boolean(parsed) && !importing && (mode === 'merge' || replaceConfirmed),
  )

  function plural(count: number, singular: string): string {
    return count === 1 ? singular : `${singular}s`
  }

  function exportSessions(): void {
    const sessions = $state.snapshot(historyState.sessions) as Session[]
    if (sessions.length === 0) return

    const blob = new Blob([serializeBackup(createBackup(sessions))], {
      type: 'application/json',
    })
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement('a')
    anchor.href = url
    anchor.download = backupFilename()
    document.body.appendChild(anchor)
    anchor.click()
    anchor.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0)
    showToast(`Exported ${sessions.length} ${plural(sessions.length, 'session')}`)
  }

  function chooseFile(): void {
    fileInput?.click()
  }

  async function handleFile(event: Event): Promise<void> {
    const input = event.currentTarget as HTMLInputElement
    const file = input.files?.[0]
    input.value = ''
    if (!file) return

    selectedFileName = file.name
    parsed = null
    error = ''
    mode = 'merge'
    replaceConfirmed = false

    if (file.size > MAX_BACKUP_BYTES) {
      error = 'This backup is too large to import.'
      return
    }

    try {
      parsed = parseBackup(await file.text())
    } catch (cause) {
      error = cause instanceof BackupError ? cause.message : 'Could not read this backup.'
    }
  }

  async function setMode(next: ImportMode, focus = false): Promise<void> {
    mode = next
    replaceConfirmed = false
    error = ''

    if (!focus) return
    await tick()
    document.querySelector<HTMLElement>(`[data-testid="data-mode-${next}"]`)?.focus()
  }

  function handleModeKeydown(event: KeyboardEvent): void {
    if (
      event.key !== 'ArrowLeft' &&
      event.key !== 'ArrowRight' &&
      event.key !== 'ArrowUp' &&
      event.key !== 'ArrowDown' &&
      event.key !== 'Home' &&
      event.key !== 'End'
    ) {
      return
    }

    event.preventDefault()
    const next =
      event.key === 'ArrowLeft' || event.key === 'ArrowUp' || event.key === 'Home'
        ? 'merge'
        : 'replace'
    void setMode(next, true)
  }

  function clearFile(): void {
    parsed = null
    selectedFileName = ''
    error = ''
    mode = 'merge'
    replaceConfirmed = false
  }

  async function importNow(): Promise<void> {
    if (!parsed || !canImport) return

    importing = true
    error = ''

    try {
      const result = await importSessions(parsed.sessions, mode)
      let message: string

      if (result.imported === 0) {
        message = 'No new sessions imported'
      } else if (result.mode === 'replace') {
        message = `Replaced history with ${result.imported} ${plural(result.imported, 'session')}`
      } else {
        message = `Imported ${result.imported} ${plural(result.imported, 'session')}`
        if (result.skipped > 0) message += `, skipped ${result.skipped}`
      }

      if (!result.persisted) message += ' (this tab only)'
      showToast(message)
      closeAiSettings()
      if (result.mode === 'replace') goHome()
      clearFile()
    } catch {
      error = 'Could not import this backup. The current history was not changed.'
    } finally {
      importing = false
    }
  }

  function formatExportedAt(value: string): string {
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'unknown date'
    return date.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }
</script>

<div class="data-panel" data-testid="data-panel">
  <section class="data-section">
    <h3 class="data-label">Export</h3>
    <p class="data-count">
      {sessionCount}
      {plural(sessionCount, 'session')} in history.
    </p>
    <p class="data-help">
      Downloads a JSON file. It contains session text only — no API keys, Tatoeba cache, or app
      preferences.
    </p>
    <button
      class="button button-secondary"
      type="button"
      data-testid="data-export"
      disabled={sessionCount === 0}
      onclick={exportSessions}
    >
      Export sessions
    </button>
  </section>

  <section class="data-section">
    <h3 class="data-label">Import</h3>
    <p class="data-help">
      Restore a backup from this app. Merge adds new sessions; Replace restores the file exactly.
    </p>

    <input
      class="file-input"
      type="file"
      accept="application/json,.json"
      tabindex="-1"
      aria-hidden="true"
      bind:this={fileInput}
      onchange={handleFile}
      data-testid="backup-file-input"
    />

    <div class="data-actions">
      <button class="button button-secondary" type="button" onclick={chooseFile}>
        {selectedFileName ? 'Choose another file' : 'Choose backup file'}
      </button>
      {#if selectedFileName}
        <span class="data-file">{selectedFileName}</span>
      {/if}
    </div>

    {#if parsed}
      <p class="data-preview" data-testid="data-import-preview">
        {parsed.sessions.length}
        {plural(parsed.sessions.length, 'session')} · exported
        {formatExportedAt(parsed.exportedAt)}
      </p>

      <div
        class="mode"
        role="radiogroup"
        aria-label="Import mode"
        tabindex="-1"
        onkeydown={handleModeKeydown}
      >
        <button
          class="mode-btn"
          class:is-on={mode === 'merge'}
          type="button"
          role="radio"
          aria-checked={mode === 'merge'}
          tabindex={mode === 'merge' ? 0 : -1}
          data-testid="data-mode-merge"
          onclick={() => void setMode('merge')}
        >
          Merge
        </button>
        <button
          class="mode-btn"
          class:is-on={mode === 'replace'}
          type="button"
          role="radio"
          aria-checked={mode === 'replace'}
          tabindex={mode === 'replace' ? 0 : -1}
          data-testid="data-mode-replace"
          onclick={() => void setMode('replace')}
        >
          Replace
        </button>
      </div>

      {#if mode === 'replace'}
        <label class="confirm">
          <input
            type="checkbox"
            bind:checked={replaceConfirmed}
            data-testid="data-replace-confirm"
          />
          <span>I understand this deletes the current history.</span>
        </label>
      {/if}

      <button
        class="button button-primary import-button"
        type="button"
        disabled={!canImport}
        data-testid="data-import-submit"
        onclick={importNow}
      >
        {importing
          ? 'Importing…'
          : mode === 'replace'
            ? `Replace with ${importCount} ${plural(importCount, 'session')}`
            : `Import ${importCount} ${plural(importCount, 'session')}`}
      </button>
    {/if}

    {#if error}
      <p class="data-error" role="alert" data-testid="data-error">{error}</p>
    {/if}
  </section>

  <p class="data-note">Backups are local files. There is no Bunkai server and no account.</p>
</div>

<style>
  .data-panel {
    padding-top: 2px;
  }

  .data-section + .data-section {
    margin-top: 20px;
    padding-top: 18px;
    border-top: 1px solid var(--line);
  }

  .data-label {
    margin-bottom: 6px;
    color: var(--muted);
    font-size: var(--fs-label);
    font-weight: 500;
    letter-spacing: 0.06em;
    line-height: var(--lh-label);
    text-transform: uppercase;
  }

  .data-count {
    color: var(--ink);
    font-size: 14px;
    line-height: 1.45;
  }

  .data-help {
    margin-top: 6px;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.45;
    text-wrap: pretty;
  }

  .data-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px 10px;
    margin-top: 10px;
  }

  .file-input {
    position: absolute;
    width: 1px;
    height: 1px;
    overflow: hidden;
    opacity: 0;
    pointer-events: none;
  }

  .data-file {
    color: var(--muted);
    font-size: 11px;
    line-height: 1.4;
    overflow-wrap: anywhere;
  }

  .data-preview {
    margin-top: 12px;
    color: var(--ink);
    font-size: 13px;
    line-height: 1.45;
  }

  .mode {
    display: flex;
    gap: 4px;
    margin-top: 10px;
    padding: 2px;
    border: 1px solid var(--control-line);
    border-radius: var(--r-btn);
    background: var(--surface-2);
  }

  .mode-btn {
    min-height: 28px;
    flex: 1 1 0;
    border: 1px solid transparent;
    border-radius: calc(var(--r-btn) - 2px);
    color: var(--muted);
    font-size: 12px;
  }

  .mode-btn.is-on {
    border-color: var(--control-line);
    background: var(--surface);
    color: var(--ink);
  }

  .confirm {
    display: flex;
    align-items: flex-start;
    gap: 8px;
    margin-top: 10px;
    color: var(--muted);
    font-size: 12px;
    line-height: 1.45;
  }

  .confirm input {
    margin-top: 2px;
    accent-color: var(--accent);
  }

  .button {
    display: inline-flex;
    min-height: 34px;
    align-items: center;
    justify-content: center;
    padding: 0 14px;
    border: 1px solid transparent;
    border-radius: var(--r-btn);
    font-size: 13px;
    font-weight: 500;
  }

  .button-primary {
    background: var(--accent);
    color: var(--accent-fg);
  }

  .button-primary:hover:not(:disabled) {
    background: color-mix(in srgb, var(--accent) 88%, var(--ink));
  }

  .button-secondary {
    border-color: var(--control-line);
    background: transparent;
    color: var(--ink);
  }

  .button-secondary:hover:not(:disabled) {
    border-color: var(--accent);
  }

  .button:disabled {
    cursor: default;
    opacity: 0.45;
  }

  .import-button {
    width: 100%;
    margin-top: 12px;
  }

  .data-error {
    margin-top: 10px;
    padding: 10px 12px;
    border: 1px solid var(--line-strong);
    border-radius: var(--r-note);
    background: var(--surface);
    color: var(--ink);
    font-size: 12px;
    line-height: 1.45;
    text-wrap: pretty;
  }

  .data-note {
    margin-top: 18px;
    padding-top: 12px;
    border-top: 1px dashed var(--line);
    color: var(--muted);
    font-size: 11px;
    line-height: 1.4;
  }
</style>
