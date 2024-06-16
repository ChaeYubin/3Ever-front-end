import { ApiResponse } from '@/models/ApiData'
import { loginResponse } from '@/models/user'
import { AxiosResponse } from 'axios'
import API from './API'

/** 회원가입 API */
export async function signup(
  username: string,
  password: string,
  nickname: string,
  email: string
): Promise<ApiResponse<loginResponse>> {
  try {
    const response: AxiosResponse = await API.post(`/api/auth/register`, {
      username: username,
      password: password,
      nickname: nickname,
      email: email,
    })

    return {
      success: true,
      data: response.data,
    }
  } catch (err: any) {
    return {
      success: false,
      error:
        err.response?.data?.message || err.message || 'Unknown error occurred',
    }
  }
}

/** 로그인 API */
export async function login(
  username: string,
  password: string
): Promise<ApiResponse<loginResponse>> {
  try {
    const response: AxiosResponse = await API.post(`/api/auth/login`, {
      username: username,
      password: password,
    })

    return {
      success: true,
      data: response.data,
    }
  } catch (err: any) {
    return {
      success: false,
      error:
        err.response?.data?.message || err.message || 'Unknown error occurred',
    }
  }
}

/** 로그아웃 API */
export async function logout(): Promise<ApiResponse<loginResponse>> {
  try {
    const response: AxiosResponse = await API.post(`/api/auth/logout`)

    return {
      success: true,
      data: response.data,
    }
  } catch (err: any) {
    return {
      success: false,
      error:
        err.response?.data?.message || err.message || 'Unknown error occurred',
    }
  }
}

/** 유저 로그인 확인 API */
export async function checkLoginStatus(): Promise<ApiResponse<loginResponse>> {
  try {
    const response: AxiosResponse = await API.get(`/api/auth/status`)

    return {
      success: true,
      data: response.data,
    }
  } catch (err: any) {
    return {
      success: false,
      error:
        err.response?.data?.message || err.message || 'Unknown error occurred',
    }
  }
}
