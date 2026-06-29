import './bootstrap';
import '../css/app.css';
import { StrictMode, createElement } from 'react';
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';
const pages = import.meta.glob('./Pages/**/*.jsx');

createInertiaApp({
  resolve: async (name) => {
    const importPage = pages[`./Pages/${name}.jsx`];

    if (!importPage) {
      throw new Error(`Unknown Inertia page: ${name}`);
    }

    const module = await importPage();
    return module.default;
  },
  setup({ el, App, props }) {
    createRoot(el).render(
      createElement(
        StrictMode,
        null,
        createElement(App, props),
      ),
    );
  },
  progress: {
    color: '#2563eb',
  },
});
