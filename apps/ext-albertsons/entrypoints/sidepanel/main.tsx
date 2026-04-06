import React from 'react';
import ReactDOM from 'react-dom/client';
import { RuntimeSidePanelHomePage } from '@shopflow/ui';
import { appDefinition } from '../../src/app-definition';

const root = document.getElementById('root');

if (!root) {
  throw new Error('Missing #root element for Albertsons side panel.');
}

ReactDOM.createRoot(root).render(
  <React.StrictMode>
    <RuntimeSidePanelHomePage app={appDefinition} />
  </React.StrictMode>
);
