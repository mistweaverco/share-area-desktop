import { mount } from 'svelte'
import App from './MainWin.svelte'

const app = mount(App, { target: document.getElementById('app') })

export default app
