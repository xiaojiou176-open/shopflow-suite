import React from 'react';
import ReactDOM from 'react-dom/client';
import { RuntimePopupLauncher } from '@shopflow/ui';
import { appDefinition } from '../../src/app-definition';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Missing #root element for Albertsons popup.');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <RuntimePopupLauncher app={appDefinition} />
  </React.StrictMode>
);
