import { mount } from 'svelte'
import './lib/styles/fonts.css'
import './lib/styles/tokens.css'
import './lib/styles/base.css'
import App from './App.svelte'
import { appState } from './lib/stores/app.svelte'

document.documentElement.dataset.theme = appState.theme

const app = mount(App, {
  target: document.getElementById('app')!,
})

export default app
