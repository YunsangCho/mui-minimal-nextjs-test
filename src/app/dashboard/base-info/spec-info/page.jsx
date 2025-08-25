import { CONFIG } from 'src/global-config';

import { SpecInfoListView } from 'src/sections/base-info/view';

// ----------------------------------------------------------------------

export const metadata = { title: `사양정보관리 | 기준정보관리 - ${CONFIG.appName}` };

export default function Page() {
  return <SpecInfoListView />;
} 