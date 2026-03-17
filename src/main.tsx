/// <reference types="vite/client" />
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { ClerkProvider } from '@clerk/clerk-react';
import App from './App.tsx';
import './index.css';

const PUBLISHABLE_KEY = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const BYPASS_AUTH = import.meta.env.VITE_BYPASS_AUTH === 'true';

if (!PUBLISHABLE_KEY && !BYPASS_AUTH) {
  throw new Error("Missing Publishable Key");
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {BYPASS_AUTH ? (
      <App />
    ) : (
      <ClerkProvider publishableKey={PUBLISHABLE_KEY!}>
        <App />
      </ClerkProvider>
    )}
  </StrictMode>,
);
