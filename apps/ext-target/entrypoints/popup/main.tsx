import { createRoot } from 'react-dom/client';
import { RuntimePopupLauncher } from '@shopflow/ui';
import { appDefinition } from '../../src/app-definition';

createRoot(document.getElementById('root')!).render(
  <RuntimePopupLauncher app={appDefinition} />
);
