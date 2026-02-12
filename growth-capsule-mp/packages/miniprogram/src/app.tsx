import { PropsWithChildren, Fragment } from 'react'
import { useLaunch } from '@tarojs/taro'
import { ensureLogin } from './api/auth'
import './app.scss'

function App({ children }: PropsWithChildren) {
  useLaunch(() => {
    console.log('App launched.')
    // Auto-login on launch
    ensureLogin()
  })

  return <Fragment>{children}</Fragment>
}

export default App
