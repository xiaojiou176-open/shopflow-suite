import { createRoot } from 'react-dom/client';
import { RuntimeSidePanelHomePage } from '@shopflow/ui';
import { appDefinition } from '../../src/app-definition';

createRoot(document.getElementById('root')!).render(
  <RuntimeSidePanelHomePage app={appDefinition} />
);
