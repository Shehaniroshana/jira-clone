import React from 'react'
import ReactDOM from 'react-dom/client'
import CallClone from './App.tsx'
import './index.css'
import './i18n'

import { DynamicPortWrapper } from './components/DynamicPortWrapper'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <DynamicPortWrapper>
      <CallClone />
    </DynamicPortWrapper>
  </React.StrictMode>,
)
