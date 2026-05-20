import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import './index.css'

import {App} from '@/app/App';

const rootEl = document.getElementById("root");
if (!rootEl) {
  throw new Error("#root not found");
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App/>
  </StrictMode>,
)
