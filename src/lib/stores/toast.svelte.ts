export interface ToastState {
  message: string
  actionLabel: string
  visible: boolean
}

export const toastState = $state<ToastState>({
  message: '',
  actionLabel: '',
  visible: false,
})

let action: (() => void) | null = null
let timer: ReturnType<typeof setTimeout> | null = null

export function showToast(
  message: string,
  actionLabel = '',
  onAction: (() => void) | null = null,
  duration = 3200,
): void {
  toastState.message = message
  toastState.actionLabel = actionLabel
  toastState.visible = true
  action = onAction

  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    toastState.visible = false
    toastState.actionLabel = ''
    action = null
    timer = null
  }, duration)
}

export function hideToast(): void {
  if (timer) {
    clearTimeout(timer)
    timer = null
  }

  toastState.visible = false
  toastState.actionLabel = ''
  action = null
}

export function runToastAction(): void {
  const next = action
  hideToast()
  next?.()
}
