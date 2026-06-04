// src/pages/Redirect.jsx

import React, { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api, { backendBaseUrl } from '../api/axios'

export default function Redirect() {
  const { code } = useParams()
  const [status, setStatus] = useState('loading')
  const [error, setError] = useState('')
  const [title, setTitle] = useState('')
  const [password, setPassword] = useState('')
  const [pwError, setPwError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const doRedirect = useCallback(async () => {
    try {
      const res = await api.get(`${backendBaseUrl}/s/${code}/?format=json`)
      window.location.assign(res.data.original_url)
    } catch (err) {
      setStatus('error')
      setError(err.response?.data?.error || 'Failed to redirect.')
    }
  }, [code])

  const checkStatus = useCallback(async () => {
    setStatus('loading')
    setError('')
    try {
      const res = await api.get(`/urls/status/${code}/`)
      if (res.data.status === 'ok') {
        doRedirect()
        return
      }
      setStatus(res.data.status)
      setTitle(res.data.title || '')
    } catch (err) {
      const nextStatus = err.response?.data?.status || 'not_found'
      setStatus(nextStatus)
      setError(err.response?.data?.error || 'Something went wrong.')
      if (nextStatus === 'password_required') setTitle(err.response?.data?.title || '')
    }
  }, [code, doRedirect])

  useEffect(() => {
    checkStatus()
  }, [checkStatus])

  const handlePassword = async e => {
    e.preventDefault()
    setSubmitting(true)
    setPwError('')
    try {
      const res = await api.post(`/urls/verify/${code}/`, { password })
      window.location.assign(res.data.original_url)
    } catch (err) {
      setPwError(err.response?.data?.error || 'Incorrect password.')
    } finally {
      setSubmitting(false)
    }
  }

  if (status === 'loading') return (
    <div className="min-vh-100 bg-dark d-flex align-items-center justify-content-center p-4">
      <div className="text-center text-white">
        <div className="spinner-border text-primary mb-3" style={{ width: '3rem', height: '3rem' }} />
        <p className="text-muted">Opening your link...</p>
      </div>
    </div>
  )

  if (status === 'password_required') return (
    <div className="min-vh-100 bg-dark d-flex align-items-center justify-content-center p-4">
      <div className="card bg-secondary text-white shadow-lg" style={{ width: 'min(100%, 420px)' }}>
        <div className="card-body p-4 p-md-5">
          <p className="text-primary fw-semibold mb-2">Protected link</p>
          <h4 className="fw-bold mb-2">Enter the password</h4>
          {title && <p className="text-muted mb-4">{title}</p>}
          <form onSubmit={handlePassword}>
            <input
              type="password"
              className="form-control bg-dark text-white border-secondary mb-3"
              placeholder="Password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              autoFocus
            />
            {pwError && <div className="alert alert-danger py-2">{pwError}</div>}
            <button type="submit" className="btn btn-primary w-100 fw-bold" disabled={submitting}>
              {submitting ? 'Checking...' : 'Unlock link'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )

  const cfg = {
    not_found: { title: 'Link not found', color: 'danger' },
    expired: { title: 'Link has expired', color: 'warning' },
    disabled: { title: 'Link is disabled', color: 'secondary' },
    error: { title: 'Something went wrong', color: 'danger' },
  }[status] || { title: 'Error', color: 'danger' }

  return (
    <div className="min-vh-100 bg-dark d-flex align-items-center justify-content-center p-4">
      <div className="card bg-secondary text-white shadow-lg text-center" style={{ width: 'min(100%, 420px)' }}>
        <div className="card-body p-4 p-md-5">
          <p className={`text-${cfg.color} fw-semibold mb-2`}>SmartURL Pro</p>
          <h4 className="fw-bold mb-2">{cfg.title}</h4>
          <p className="text-muted mb-4">{error}</p>
          <a href="/" className="btn btn-outline-primary">Go home</a>
        </div>
      </div>
    </div>
  )
}
