import { _mock } from 'src/_mock';

// ----------------------------------------------------------------------

export const CROSS_CHECK_STATUS_OPTIONS = [
  { value: 'active', label: '활성화' },
  { value: 'inactive', label: '비활성화' },
  { value: 'warning', label: '주의' },
];

export const _crossCheckList = [...Array(24)].map((_, index) => ({
  id: _mock.id(index),
  checkCode: `CHECK-${1000 + index}`,
  checkName: `이종체크 항목 ${index + 1}`,
  category: ['품질', '안전', '호환성', '기능', '규제'][index % 5],
  status: CROSS_CHECK_STATUS_OPTIONS[index % 3].value,
  priority: ['높음', '중간', '낮음'][index % 3],
  createdAt: _mock.time(index),
  updatedAt: _mock.time(index),
})); 