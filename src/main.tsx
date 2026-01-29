import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { RoleProvider } from './context/RoleContext'

createRoot(document.getElementById('root')!).render(
    <StrictMode>
        <RoleProvider>
            <App />
        </RoleProvider>
    </StrictMode>,
)
