import type { UserConfigExport } from '@tarojs/cli'

export default {
  logger: {
    quiet: false,
    stats: true,
  },
  defineConstants: {
    'process.env.TARO_APP_API_URL': JSON.stringify(process.env.TARO_APP_API_URL || 'http://localhost:3001'),
  },
  mini: {},
  h5: {},
} satisfies UserConfigExport
