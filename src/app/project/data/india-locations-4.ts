/**
 * India States and Districts Data - Part 4
 * West Bengal + Combined Index
 */

import { State } from './india-locations';

export const INDIA_STATES_PART4: State[] = [
  {
    code: 'WB', name: 'West Bengal',
    districts: [
      { name: 'Alipurduar' }, { name: 'Bankura', famousFor: ['Bankura Horse', 'Terracotta'] },
      { name: 'Birbhum', famousFor: ['Kantha Stitch', 'Batik'] },
      { name: 'Cooch Behar' },
      { name: 'Dakshin Dinajpur' },
      { name: 'Darjeeling', famousFor: ['Darjeeling Tea'] },
      { name: 'Hooghly' }, { name: 'Howrah' }, { name: 'Jalpaiguri' },
      { name: 'Jhargram' }, { name: 'Kalimpong' },
      { name: 'Kolkata', famousFor: ['Dokra Art', 'Terracotta'] },
      { name: 'Malda', famousFor: ['Malda Mango'] },
      { name: 'Murshidabad', famousFor: ['Murshidabad Silk'] },
      { name: 'Nadia', famousFor: ['Nakshi Kantha'] },
      { name: 'North 24 Parganas' }, { name: 'Paschim Bardhaman' },
      { name: 'Paschim Medinipur' }, { name: 'Purba Bardhaman' },
      { name: 'Purba Medinipur' }, { name: 'Purulia', famousFor: ['Chhau Mask'] },
      { name: 'South 24 Parganas' }, { name: 'Uttar Dinajpur' }
    ]
  }
];
