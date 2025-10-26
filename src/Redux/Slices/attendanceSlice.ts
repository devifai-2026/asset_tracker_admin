// redux/Slices/offlineAttendanceSlice.ts
import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AttendanceRecord {
  emp_id: string | null;
  lat: number;
  lng: number;
  date: string;
  time: string;
  type: 'login' | 'logout';
}

interface OfflineAttendanceState {
  pending: AttendanceRecord[];
  lastAction: 'login' | 'logout' | null; // 🔁 track last action
}

const initialState: OfflineAttendanceState = {
  pending: [],
  lastAction: null,
};

const offlineAttendanceSlice = createSlice({
  name: 'offlineAttendance',
  initialState,
  reducers: {
    addOfflineAttendance: (state, action: PayloadAction<AttendanceRecord>) => {
      state.pending.push(action.payload);
      state.lastAction = action.payload.type;
    },
    clearOfflineAttendance: state => {
      state.pending = [];
    },
    setLastAction: (state, action: PayloadAction<'login' | 'logout' | null>) => {
      state.lastAction = action.payload;
    },
  },
});

export const { addOfflineAttendance, clearOfflineAttendance, setLastAction } = offlineAttendanceSlice.actions;
export default offlineAttendanceSlice.reducer;
