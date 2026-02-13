/**
 * India Locations - Combined Index
 * Exports all states/districts and utility functions
 */

import { State, District, INDIA_STATES, FAMOUS_ODOP_PRODUCTS } from './india-locations';
import { INDIA_STATES_PART2 } from './india-locations-2';
import { INDIA_STATES_PART3 } from './india-locations-3';
import { INDIA_STATES_PART4 } from './india-locations-4';

// Re-export types
export { State, District, FAMOUS_ODOP_PRODUCTS };

// Combined all states
export const ALL_INDIA_STATES: State[] = [
  ...INDIA_STATES,
  ...INDIA_STATES_PART2,
  ...INDIA_STATES_PART3,
  ...INDIA_STATES_PART4
];

// Get all state names
export function getAllStateNames(): string[] {
  return ALL_INDIA_STATES.map(s => s.name).sort();
}

// Get all state codes
export function getAllStateCodes(): string[] {
  return ALL_INDIA_STATES.map(s => s.code).sort();
}

// Get districts by state name
export function getDistrictsByState(stateName: string): District[] {
  const state = ALL_INDIA_STATES.find(s => 
    s.name.toLowerCase() === stateName.toLowerCase()
  );
  return state?.districts || [];
}

// Get districts by state code
export function getDistrictsByStateCode(stateCode: string): District[] {
  const state = ALL_INDIA_STATES.find(s => 
    s.code.toLowerCase() === stateCode.toLowerCase()
  );
  return state?.districts || [];
}

// Get state by name
export function getStateByName(stateName: string): State | undefined {
  return ALL_INDIA_STATES.find(s => 
    s.name.toLowerCase() === stateName.toLowerCase()
  );
}

// Get state by code
export function getStateByCode(stateCode: string): State | undefined {
  return ALL_INDIA_STATES.find(s => 
    s.code.toLowerCase() === stateCode.toLowerCase()
  );
}

// Search districts across all states
export function searchDistricts(query: string): { state: State; district: District }[] {
  const results: { state: State; district: District }[] = [];
  const lowerQuery = query.toLowerCase();
  
  ALL_INDIA_STATES.forEach(state => {
    state.districts.forEach(district => {
      if (district.name.toLowerCase().includes(lowerQuery)) {
        results.push({ state, district });
      }
    });
  });
  
  return results;
}

// Get famous products by district
export function getFamousProductsByDistrict(districtName: string): string[] {
  for (const state of ALL_INDIA_STATES) {
    const district = state.districts.find(d => 
      d.name.toLowerCase() === districtName.toLowerCase()
    );
    if (district?.famousFor) {
      return district.famousFor;
    }
  }
  return [];
}

// Get all districts with ODOP products
export function getDistrictsWithODOPProducts(): { state: State; district: District }[] {
  const results: { state: State; district: District }[] = [];
  
  ALL_INDIA_STATES.forEach(state => {
    state.districts.forEach(district => {
      if (district.famousFor && district.famousFor.length > 0) {
        results.push({ state, district });
      }
    });
  });
  
  return results;
}

// Total counts
export const TOTAL_STATES = ALL_INDIA_STATES.length;
export const TOTAL_DISTRICTS = ALL_INDIA_STATES.reduce(
  (sum, state) => sum + state.districts.length, 0
);
