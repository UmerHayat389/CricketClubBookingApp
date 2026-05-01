import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Employee {
  _id: string;
  name: string;
  designation: string;
  phone: string;
  email: string;
  salary: number;
  joinDate: string;
  address: string;
  photo: string;
  status: 'active' | 'inactive';
  createdAt?: string;
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
    setEmployees: (state, action: PayloadAction<Employee[]>) => {
      state.employees = action.payload;
    },

    addEmployee: (state, action: PayloadAction<Employee>) => {
      const exists = state.employees.find(e => e._id === action.payload._id);
      if (!exists) state.employees.unshift(action.payload);
    },

    updateEmployee: (state, action: PayloadAction<Employee>) => {
      state.employees = state.employees.map(e =>
        e._id === action.payload._id ? action.payload : e
      );
    },

    removeEmployee: (state, action: PayloadAction<string>) => {
      state.employees = state.employees.filter(e => e._id !== action.payload);
    },
  },
});

export const { setEmployees, addEmployee, updateEmployee, removeEmployee } =
  employeeSlice.actions;

export default employeeSlice.reducer;