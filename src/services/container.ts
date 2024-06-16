import { AxiosResponse } from 'axios'
import API from './API'
import { Container } from '@/models/container'
import { Entry } from '@/models/entry'
import { ApiResponse } from '@/models/ApiData'

/** 컨테이너 생성 API */
export async function createContainer(
  title: string,
  description: string,
  language: string
): Promise<ApiResponse<Omit<Container, 'id'>>> {
  try {
    const response: AxiosResponse = await API.post(`/api/workspaces`, {
      title,
      description,
      language,
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

/** 컨테이너 실행 API */
export async function startContainer(
  containerId: number
): Promise<ApiResponse<Entry>> {
  try {
    const response: AxiosResponse = await API.get(
      `/api/workspaces/${containerId}`
    )

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

// NOTE - 테스트용
interface Response {
  result: Container[]
  message: string
}

/** 컨테이너 조회 API */
export async function getContainer(
  category: string
): Promise<ApiResponse<Response>> {
  try {
    const response: AxiosResponse<Response> = await API.get(
      `/api/workspaces/${category}/get`
    )

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
