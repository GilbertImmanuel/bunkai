import { animate } from 'motion'

type MotionControls = ReturnType<typeof animate>

export interface SidebarPanelParams {
  open: boolean
  drawer: boolean
}

const EASE_OUT: [number, number, number, number] = [0.23, 1, 0.32, 1]
const EASE_DRAWER: [number, number, number, number] = [0.32, 0.72, 0, 1]

function reduceMotion(): boolean {
  return (
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )
}

interface PanelTarget {
  opacity: number
  transform: string
  pointerEvents: 'auto' | 'none'
}

function panelTarget(open: boolean, drawer: boolean): PanelTarget {
  if (drawer) {
    return {
      opacity: 1,
      transform: open ? 'translateX(0px)' : 'translateX(360px)',
      pointerEvents: open ? 'auto' : 'none',
    }
  }

  return {
    opacity: open ? 1 : 0,
    transform: open ? 'translateX(0px)' : 'translateX(10px)',
    pointerEvents: open ? 'auto' : 'none',
  }
}

function setPanelTarget(node: HTMLElement, target: PanelTarget): void {
  node.style.opacity = String(target.opacity)
  node.style.transform = target.transform
  node.style.pointerEvents = target.pointerEvents
}

export function animateSidebarPanel(node: HTMLElement, params: SidebarPanelParams) {
  let controls: MotionControls | undefined
  let previous = { ...params }

  setPanelTarget(node, panelTarget(params.open, params.drawer))

  return {
    update(next: SidebarPanelParams) {
      if (next.open === previous.open && next.drawer === previous.drawer) return

      controls?.stop()

      const target = panelTarget(next.open, next.drawer)
      const drawerChanged = next.drawer !== previous.drawer
      previous = { ...next }

      node.style.pointerEvents = target.pointerEvents

      if (drawerChanged || reduceMotion()) {
        setPanelTarget(node, target)
        return
      }

      if (next.drawer) {
        node.style.opacity = '1'
        controls = animate(
          node,
          { transform: target.transform },
          { type: 'tween', duration: next.open ? 0.32 : 0.22, ease: EASE_DRAWER },
        )
        return
      }

      const currentOpacity = Number.parseFloat(getComputedStyle(node).opacity) || 0
      controls = animate(
        node,
        {
          opacity: [currentOpacity, target.opacity],
          transform: target.transform,
        },
        { type: 'tween', duration: next.open ? 0.22 : 0.16, ease: EASE_OUT },
      )
    },
    destroy() {
      controls?.stop()
    },
  }
}

function setRailTarget(node: HTMLElement, open: boolean): void {
  node.style.opacity = open ? '0' : '1'
  node.style.transform = open ? 'translateX(-4px)' : 'translateX(0px)'
  node.style.pointerEvents = open ? 'none' : 'auto'
}

export function animateSidebarRail(node: HTMLElement, open: boolean) {
  let controls: MotionControls | undefined
  let previous = open

  setRailTarget(node, open)

  return {
    update(next: boolean) {
      if (next === previous) return

      controls?.stop()
      previous = next
      node.style.pointerEvents = next ? 'none' : 'auto'

      if (reduceMotion()) {
        setRailTarget(node, next)
        return
      }

      controls = animate(
        node,
        {
          opacity: next ? 0 : 1,
          transform: next ? 'translateX(-4px)' : 'translateX(0px)',
        },
        { duration: next ? 0.12 : 0.16, ease: EASE_OUT },
      )
    },
    destroy() {
      controls?.stop()
    },
  }
}

export function animateScrim(node: HTMLElement, open: boolean) {
  let controls: MotionControls | undefined
  let previous = open

  node.style.opacity = open ? '1' : '0'
  node.style.pointerEvents = open ? 'auto' : 'none'

  return {
    update(next: boolean) {
      if (next === previous) return

      controls?.stop()
      previous = next
      node.style.pointerEvents = next ? 'auto' : 'none'

      if (reduceMotion()) {
        node.style.opacity = next ? '1' : '0'
        return
      }

      controls = animate(
        node,
        { opacity: next ? 1 : 0 },
        { duration: next ? 0.2 : 0.14, ease: EASE_OUT },
      )
    },
    destroy() {
      controls?.stop()
    },
  }
}

export function animateTranslationText(node: HTMLElement, mode: string) {
  let controls: MotionControls | undefined
  let previous = mode

  return {
    update(next: string) {
      if (next === previous) return

      controls?.stop()
      previous = next

      if (reduceMotion()) {
        node.style.opacity = '1'
        node.style.transform = 'translateY(0px)'
        return
      }

      controls = animate(
        node,
        {
          opacity: [0, 1],
          transform: ['translateY(4px)', 'translateY(0px)'],
        },
        { duration: 0.18, ease: EASE_OUT },
      )
    },
    destroy() {
      controls?.stop()
    },
  }
}
