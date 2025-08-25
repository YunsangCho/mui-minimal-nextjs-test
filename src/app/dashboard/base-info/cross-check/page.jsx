import { CONFIG } from 'src/global-config';

import { CrossCheckListView } from 'src/sections/base-info/view';

// ----------------------------------------------------------------------

export const metadata = { title: `이종체크관리 | 기준정보관리 - ${CONFIG.appName}` };

export default function Page() {
  return <CrossCheckListView />;
} 