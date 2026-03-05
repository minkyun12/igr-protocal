export function createState(cases = []) {
  return {
    allCases: [...cases],
    filtered: [...cases],
    activeCaseId: cases[0]?.case_id,
  };
}

export function activeCase(state) {
  return state.filtered.find((c) => c.case_id === state.activeCaseId);
}

export function setCases(state, cases = []) {
  state.allCases.splice(0, state.allCases.length, ...cases);
  state.filtered = [...state.allCases];
  state.activeCaseId = state.filtered[0]?.case_id;
}
