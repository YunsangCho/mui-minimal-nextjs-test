import { _mock } from 'src/_mock';

// ----------------------------------------------------------------------

export const SPEC_STATUS_OPTIONS = [
  { value: 'active', label: '활성화' },
  { value: 'inactive', label: '비활성화' },
  { value: 'pending', label: '검토중' },
];

export const _specList = [...Array(24)].map((_, index) => ({
  id: _mock.id(index),
  carType: ['JA', 'KA', 'LA'][Math.floor(index / 8)],
  lineId: ['FR01', 'RR01'][index % 2],
  alcCode: `${String.fromCharCode(65 + Math.floor(index / 2))}${String.fromCharCode(65 + (index % 2))}`,
  type: ['JAPE2STD', 'JAPE2GT', 'KAPE1STD'][Math.floor(index / 8)],
  itemCd: `86${index % 2 === 0 ? '5' : '6'}00G6${String.fromCharCode(65 + Math.floor(index / 2))}${String.fromCharCode(65 + (index % 2))}0`,
  bodyType: 'G6',
  etcText01: ['', '부식', '유광'][index % 3],
  etcText02: ['부식', '유광', ''][index % 3],
  etcText03: ['O', 'X', '부식'][index % 3],
  etcText04: ['유광', '부식 AEB', '유광 AEB', 'L.H분리', '백업분리'][index % 5],
  etcText05: ['X', 'O', '6070', '6050'][index % 4],
  etcText06: ['', '내수', '유럽'][index % 3],
  etcText07: '',
  createdAt: _mock.time(index),
  updatedAt: _mock.time(index),
})); 