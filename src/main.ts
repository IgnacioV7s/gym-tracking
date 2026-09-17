import 'vue-sonner/style.css'
import '@/assets/main.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { i18n, detectLocale, setLocale } from '@/i18n'

const app = createApp(App)

app.use(createPinia())
app.use(router)
app.use(i18n)
setLocale(detectLocale())

app.mount('#app')
