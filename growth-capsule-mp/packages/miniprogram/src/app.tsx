import { PropsWithChildren, Fragment } from 'react'
import { useLaunch } from '@tarojs/taro'
import { initCloud } from './api/cloud'
import { ensureLogin } from './api/auth'
import './app.scss'

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    console.log('App launched.')
    // Initialize cloud before auth
    initCloud()
    ensureLogin()
  })

  return <Fragment>{children}</Fragment>
}

export default App
