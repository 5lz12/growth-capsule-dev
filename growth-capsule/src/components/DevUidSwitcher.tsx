'use client'

import { useState, useEffect, useCallback } from 'react'

const PRESET_UIDS = [
  { uid: 'uid_default_local', label: 'Default' },
  { uid: 'uid_alice', label: 'Alice' },
  { uid: 'uid_bob', label: 'Bob' },
]

/**
 * Floating dev toolbar for switching the current user UID.
 * Only renders in development mode.
 * Sets a cookie via /api/dev/switch-uid so that all subsequent
 * browser requests (including page navigations) carry the uid.
 */
export default function DevUidSwitcher() {
  const [currentUid, setCurrentUid] = useState<string>('')
  const [isOpen, setIsOpen] = useState(false)
  const [customUid, setCustomUid] = useState('')

  // Read current uid on mount
  useEffect(() => {
    fetch('/api/dev/switch-uid')
      .then(r => r.json())
      .then(data => setCurrentUid(data.uid))
      .catch(() => setCurrentUid('uid_default_local'))
  }, [])

  const switchUid = useCallback(async (uid: string) => {
    try {
      const res = await fetch('/api/dev/switch-uid', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      })
      const data = await res.json()
      if (data.success) {
        setCurrentUid(uid)
        setIsOpen(false)
        // Reload to reflect new user data
        window.location.reload()
      }
    } catch (e) {
      console.error('Failed to switch uid:', e)
    }
  }, [])

  // Don't render in production
  if (process.env.NODE_ENV === 'production') return null

  const shortLabel = PRESET_UIDS.find(p => p.uid === currentUid)?.label || currentUid

  return (
    <div style={{ position: 'fixed', top: 8, right: 8, zIndex: 99999, fontFamily: 'monospace', fontSize: 12 }}>
      {/* Toggle button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          background: '#1e293b',
          color: '#38bdf8',
          border: '1px solid #334155',
          borderRadius: 6,
          padding: '4px 10px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: 4,
        }}
      >
        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
        DEV: {shortLabel}
      </button>

      {/* Panel */}
      {isOpen && (
        <div
          style={{
            background: '#0f172a',
            border: '1px solid #334155',
            borderRadius: 8,
            padding: 12,
            marginTop: 4,
            minWidth: 200,
            boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ color: '#94a3b8', marginBottom: 8 }}>Switch User</div>

          {PRESET_UIDS.map(p => (
            <button
              key={p.uid}
              onClick={() => switchUid(p.uid)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                background: currentUid === p.uid ? '#1e3a5f' : 'transparent',
                color: currentUid === p.uid ? '#38bdf8' : '#cbd5e1',
                border: 'none',
                borderRadius: 4,
                padding: '6px 8px',
                cursor: 'pointer',
                marginBottom: 2,
              }}
            >
              {currentUid === p.uid ? '> ' : '  '}{p.label}
              <span style={{ color: '#64748b', marginLeft: 8 }}>{p.uid}</span>
            </button>
          ))}

          <div style={{ borderTop: '1px solid #334155', margin: '8px 0', paddingTop: 8 }}>
            <div style={{ color: '#94a3b8', marginBottom: 4 }}>Custom UID:</div>
            <div style={{ display: 'flex', gap: 4 }}>
              <input
                type="text"
                value={customUid}
                onChange={e => setCustomUid(e.target.value)}
                placeholder="uid_xxx"
                style={{
                  flex: 1,
                  background: '#1e293b',
                  color: '#e2e8f0',
                  border: '1px solid #475569',
                  borderRadius: 4,
                  padding: '4px 6px',
                  fontSize: 12,
                }}
                onKeyDown={e => {
                  if (e.key === 'Enter' && customUid.trim()) {
                    switchUid(customUid.trim())
                  }
                }}
              />
              <button
                onClick={() => customUid.trim() && switchUid(customUid.trim())}
                style={{
                  background: '#1d4ed8',
                  color: 'white',
                  border: 'none',
                  borderRadius: 4,
                  padding: '4px 8px',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                Go
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
