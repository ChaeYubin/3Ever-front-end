import { RootState } from './index'
import { createSlice } from '@reduxjs/toolkit'
import type { PayloadAction } from '@reduxjs/toolkit'

interface StateType {
  isAuthenticated: boolean
  id: string
  nickname: string
  profileUrl: string | null
}

interface userInfo {
  id: string
  nickname: string
  profileUrl: string | null
}

const initialState: StateType = {
  // NOTE - 개발 시에는 초기 상태 true로 설정
  isAuthenticated: false,
  id: '',
  nickname: '',
  profileUrl: null,
}

export const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<userInfo>) => {
      state.isAuthenticated = true
      state.id = action.payload.id
      state.nickname = action.payload.nickname
      state.profileUrl = action.payload.profileUrl
    },
    logout: () => {
      return { ...initialState }
    },
    setId: (state, action: PayloadAction<string>) => {
      state.id = action.payload
    },
    setNickName: (state, action: PayloadAction<string>) => {
      state.nickname = action.payload
    },
    setProfileUrl: (state, action: PayloadAction<string | null>) => {
      state.profileUrl = action.payload
    },
  },
})

export const { login, logout, setId, setNickName, setProfileUrl } =
  userSlice.actions
export default userSlice.reducer

export const selectIsAuthenticated = (state: RootState) =>
  state.user.isAuthenticated
export const selectId = (state: RootState) => state.user.id
export const selectNickname = (state: RootState) => state.user.nickname
export const selectProfileUrl = (state: RootState) => state.user.profileUrl
