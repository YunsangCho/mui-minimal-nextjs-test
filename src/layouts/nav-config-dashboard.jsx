import { paths } from 'src/routes/paths';

import { CONFIG } from 'src/global-config';

import { Label } from 'src/components/label';
import { Iconify } from 'src/components/iconify';
import { SvgColor } from 'src/components/svg-color';

// ----------------------------------------------------------------------

const icon = (name) => <SvgColor src={`${CONFIG.assetsDir}/assets/icons/navbar/${name}.svg`} />;

const ICONS = {
  job: icon('ic-job'),
  blog: icon('ic-blog'),
  chat: icon('ic-chat'),
  mail: icon('ic-mail'),
  user: icon('ic-user'),
  file: icon('ic-file'),
  lock: icon('ic-lock'),
  tour: icon('ic-tour'),
  order: icon('ic-order'),
  label: icon('ic-label'),
  blank: icon('ic-blank'),
  kanban: icon('ic-kanban'),
  folder: icon('ic-folder'),
  course: icon('ic-course'),
  params: icon('ic-params'),
  banking: icon('ic-banking'),
  booking: icon('ic-booking'),
  invoice: icon('ic-invoice'),
  product: icon('ic-product'),
  calendar: icon('ic-calendar'),
  disabled: icon('ic-disabled'),
  external: icon('ic-external'),
  subpaths: icon('ic-subpaths'),
  menuItem: icon('ic-menu-item'),
  ecommerce: icon('ic-ecommerce'),
  analytics: icon('ic-analytics'),
  dashboard: icon('ic-dashboard'),
};

// ----------------------------------------------------------------------

/**
 * MongoDB 기반 메뉴 데이터를 네비게이션 형식으로 변환
 * @param {Array} menuData - MongoDB에서 가져온 메뉴 데이터
 * @returns {Array} 네비게이션 데이터
 */
export function convertMenuDataToNavData(menuData) {
  console.log('=== convertMenuDataToNavData 호출 ===');
  console.log('입력 menuData:', menuData);
  
  if (!menuData || !Array.isArray(menuData)) {
    console.log('menuData가 유효하지 않음, 기본 데이터 반환');
    return getDefaultNavData();
  }

  const items = menuData.map(menu => {
    console.log('메뉴 변환 중:', menu.menuName);
    return {
      title: menu.menuName,
      path: menu.menuPath,
      icon: ICONS[menu.icon] || ICONS.menuItem,
      children: menu.children ? menu.children.map(child => {
        console.log('  하위 메뉴:', child.menuName);
        return {
          title: child.menuName,
          path: child.menuPath,
          icon: ICONS[child.icon] || ICONS.menuItem,
        };
      }) : undefined,
    };
  });

  const result = [
    {
      subheader: 'Management',
      items,
    },
  ];
  
  console.log('변환 완료된 navData:', result);
  return result;
}

/**
 * 권한 기반 네비게이션 데이터 생성 함수 (기존 호환성 유지)
 * @param {Function} hasPermission - 권한 확인 함수
 * @returns {Array} 네비게이션 데이터
 */
export function getNavData(hasPermission) {
  // 임시로 모든 메뉴 표시 (MongoDB 연동 전까지)
  return getDefaultNavData();
}

/**
 * 기본 네비게이션 데이터
 */
export function getDefaultNavData() {
  return [
    {
      subheader: 'Management',
      items: [
        {
          title: '기준정보관리',
          path: paths.dashboard.baseInfo.root,
          icon: ICONS.analytics,
          children: [
            { title: '사양정보관리', path: paths.dashboard.baseInfo.specInfo },
            { title: '이종체크관리', path: paths.dashboard.baseInfo.crossCheck },
          ],
        },

        {
          title: '서열수신현황',
          path: paths.dashboard.receiveAlc2Data.root,
          icon: ICONS.analytics,
          children: [
            { title: '서열수신현황조회', path: paths.dashboard.receiveAlc2Data.inquiry },
          ],
        },
        // 추가 메뉴들 (현재는 모든 현장에서 표시)
        {
          title: '생산관리',
          path: '/dashboard/production',
          icon: ICONS.ecommerce,
          children: [
            { title: '생산계획', path: '/dashboard/production/plan' },
            { title: '생산실적', path: '/dashboard/production/result' },
          ],
        },
        {
          title: '품질관리',
          path: '/dashboard/quality',
          icon: ICONS.booking,
          children: [
            { title: '품질검사', path: '/dashboard/quality/inspection' },
            { title: '불량관리', path: '/dashboard/quality/defect' },
          ],
        },
        {
          title: '자재관리',
          path: '/dashboard/material',
          icon: ICONS.product,
          children: [
            { title: '자재입고', path: '/dashboard/material/receiving' },
            { title: '재고관리', path: '/dashboard/material/inventory' },
          ],
        },
      ],
    },
  ];
}

/**
 * 기본 네비게이션 데이터 (권한 확인 함수가 없을 때)
 */
export const navData = getDefaultNavData();
