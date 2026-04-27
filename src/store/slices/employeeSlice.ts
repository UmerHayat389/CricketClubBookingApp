import { createSlice } from '@reduxjs/toolkit';

interface Employee {
  _id: string;
  name: string;
  role: string;
  phone: string;
}

interface EmployeeState {
  employees: Employee[];
}

const initialState: EmployeeState = {
  employees: [],
};

const employeeSlice = createSlice({
  name: 'employee',
  initialState,
  reducers: {
    setEmployees: (state, action) => {
      state.employees = action.payload;
    },

    addEmployee: (state, action) => {
      state.employees.unshift(action.payload);
    },
  },
});

export const { setEmployees, addEmployee } =
  employeeSlice.actions;

export default employeeSlice.reducer;