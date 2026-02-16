import Taro from '@tarojs/taro'

let cloudInitialized = false

/**
 * Initialize WeChat Cloud Development.
 * Must be called once before any cloud function calls.
 */
export function initCloud(): void {
  if (cloudInitialized) return

  if (Taro.cloud) {
    Taro.cloud.init({
      traceUser: true,
    })
    cloudInitialized = true
    console.log('Cloud initialized')
  } else {
    console.warn('Taro.cloud is not available — cloud functions disabled')
  }
}

/**
 * Check whether cloud functions are available.
 */
export function isCloudAvailable(): boolean {
  return cloudInitialized && !!Taro.cloud
}

interface CloudCallResult<T = unknown> {
  result: T
}

/**
 * Call a WeChat cloud function by name.
 * Wraps Taro.cloud.callFunction with typed response.
 */
export async function callCloudFunction<T = unknown>(
  name: string,
  data: Record<string, unknown> = {}
): Promise<T> {
  if (!isCloudAvailable()) {
    throw new Error('Cloud not initialized')
  }

  const res = (await Taro.cloud.callFunction({
    name,
    data,
  })) as CloudCallResult<T>

  return res.result
}

/**
 * Upload a file to WeChat Cloud Storage.
 * Returns the fileID for later reference.
 */
export async function uploadCloudFile(options: {
  cloudPath: string
  filePath: string
}): Promise<string> {
  if (!isCloudAvailable()) {
    throw new Error('Cloud not initialized')
  }

  const res = await Taro.cloud.uploadFile({
    cloudPath: options.cloudPath,
    filePath: options.filePath,
  })

  return res.fileID
}

/**
 * Get a temporary URL for a cloud file ID.
 */
export async function getTempFileURL(fileID: string): Promise<string | null> {
  if (!isCloudAvailable() || !fileID) return null

  const res = await Taro.cloud.getTempFileURL({
    fileList: [fileID],
  })

  return res.fileList[0]?.tempFileURL || null
}
