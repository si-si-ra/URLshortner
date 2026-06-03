// src/pages/Redirect.jsx

import React, { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import axios from 'axios'

export default function Redirect() {
  const { code } = useParams()
  const [status,   setStatus]   = useState('loading')
  const [error,    setError]    = useState('')
  const [title,    setTitle]    = useState('')
  const [password, setPassword] = useState('')
  const [pwError,  setPwError]  = useState('')

  useEffect(() => { checkStatus() }, [code])

  const checkStatus = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/api/urls/status/${code}/`)
      if (res.data.status === 'ok') {
        doRedirect()
      } else {
        setStatus(res.data.status)
        setTitle(res.data.title || '')
      }
    } catch (err) {
      const s = err.response?.data?.status || 'not_found'
      setStatus(s)
      setError(err.response?.data?.error || 'Something went wrong.')
      if (s === 'password_required') setTitle(err.response?.data?.title || '')
    }
  }

  const doRedirect = async () => {
    try {
      const res = await axios.get(`http://localhost:8000/s/${code}/`)
      window.location.href = res.data.original_url
    } catch {
      setStatus('error')
      setError('Failed to redirect.')
    }
  }

  const handlePassword = async e => {
    e.preventDefault()
    setPwError('')
    try {
      const res = await axios.post(
        `http://localhost:8000/api/urls/verify/${code}/`,
        { password }
      )
      window.location.href = res.data.original_url
    } catch (err) {
      setPwError(err.response?.data?.error || 'Incorrect password.')
    }
  }

  if (status === 'loading') return (
    <div className="min-vh-100 bg-dark d-flex align-items-center justify-content-center">
      <div className="text-center text-white">
        <div className="spinner-border text-primary mb-3" style={{ width:'3rem', height:'3rem' }} />
        <p className="text-muted">Redirecting...</p>
      </div>
    </div>
  )

  if (status === 'password_required') return (
    <div className="min-vh-100 bg-dark d-flex align-items-center justify-content-center">
      <div className="card bg-secondary text-white shadow-lg" style={{ width:400 }}>
        <div className="card-body p-5 text-center">
          <div style={{ fontSize:'3rem' }}>🔒</div>
          <h4 className="fw-bold mt-2 mb-1">Password Required</h4>
          {title && <p className="text-muted">{title}</p>}
          <form onSubmit={handlePassword} className="mt-4">
            <input type="password"
              className="form-control bg-dark text-white border-secondary mb-3"
              placeholder="Enter password"
              value={password} onChange={e => setPassword(e.target.value)}
              required autoFocus />
            {pwError && <div className="alert alert-danger py-2">{pwError}</div>}
            <button type="submit" className="btn btn-primary w-100 fw-bold">Unlock Link</button>
          </form>
        </div>
      </div>
    </div>
  )

  const cfg = {
    not_found: { icon:'🔍', title:'Link Not Found',     color:'danger' },
    expired:   { icon:'⏰', title:'Link Has Expired',   color:'warning' },
    disabled:  { icon:'🚫', title:'Link Is Disabled',   color:'secondary' },
    error:     { icon:'❌', title:'Something Went Wrong', color:'danger' },
  }[status] || { icon:'❌', title:'Error', color:'danger' }

  return (
    <div className="min-vh-100 bg-dark d-flex align-items-center justify-content-center">
      <div className="card bg-secondary text-white shadow-lg text-center" style={{ width:400 }}>
        <div className="card-body p-5">
          <div style={{ fontSize:'3rem' }}>{cfg.icon}</div>
          <h4 className={`fw-bold text-${cfg.color} mt-2 mb-2`}>{cfg.title}</h4>
          <p className="text-muted">{error}</p>
          <a href="/" className="btn btn-outline-primary mt-2">Go to SmartURL Pro</a>
        </div>
      </div>
    </div>
  )
}