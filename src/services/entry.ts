import { AxiosResponse } from 'axios'
import API from './API'
import { ApiResponse } from '@/models/ApiData'
import { Entry } from '@/models/entry'

/** 파일 저장(수정) API */
export async function saveFile(
  containerId: string | number,
  fileId: string | number,
  content: string
): Promise<ApiResponse<{ content: string }>> {
  try {
    const response: AxiosResponse = await API.put(
      `/api/workspaces/${containerId}/entries/${fileId}`,
      { content: content }
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

/** 파일 실행 API */
export async function executeFile(
  extension: string,
  code: string
): Promise<ApiResponse<{ result: string }>> {
  try {
    const response: AxiosResponse = await API.post(
      `/api/workspaces/entries/execute`,
      {
        extension: `.${extension}`,
        code: code,
      }
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

/** 엔트리 생성 API */
export async function createEntry(
  containerId: string | number,
  parentId: string | number,
  name: string,
  isDirectory: boolean
): Promise<ApiResponse<Entry>> {
  try {
    const response: AxiosResponse = await API.post(
      `/api/workspaces/${containerId}/entries/${parentId}`,
      { name: name, isDirectory: isDirectory }
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

/** 엔트리 삭제 API */
export async function deleteEntry(
  containerId: string | number,
  entryId: string | number
): Promise<ApiResponse<Entry>> {
  try {
    const response: AxiosResponse = await API.delete(
      `/api/workspaces/${containerId}/entries/${entryId}`
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

/** 엔트리 이름 수정 API */
export async function editEntryName(
  containerId: string | number,
  entryId: number,
  newEntryName: string,
  isDirectory: boolean
): Promise<ApiResponse<string>> {
  try {
    const response: AxiosResponse = await API.put(
      `/api/workspaces/${containerId}/entries/${entryId}/rename`,
      {
        name: newEntryName,
        isDirectory: isDirectory,
      }
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
