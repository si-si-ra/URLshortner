// src/pages/Register.jsx

import React, { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Register() {
  const [form,    setForm]    = useState({ username:'', email:'', password:'', password2:'' })
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { register } = useAuth()
  const navigate = useNavigate()

  const handleChange = e => {
    setForm({ ...form, [e.target.name]: e.target.value })
    if (errors[e.target.name] || errors.general) {
      setErrors({ ...errors, [e.target.name]: null, general: null })
    }
  }

  const validateForm = () => {
    const nextErrors = {}
    const username = form.username.trim()
    const email = form.email.trim()

    if (!username) nextErrors.username = ['Username is required.']
    else if (username.length < 3) nextErrors.username = ['Username must be at least 3 characters long.']

    if (!email) nextErrors.email = ['Email address is required.']
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = ['Enter a valid email address.']
    }

    if (!form.password) nextErrors.password = ['Password is required.']
    else if (form.password.length < 8) nextErrors.password = ['Password must be at least 8 characters long.']

    if (!form.password2) nextErrors.password2 = ['Please confirm your password.']
    else if (form.password !== form.password2) nextErrors.password2 = ['Passwords do not match.']

    return nextErrors
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const validationErrors = validateForm()
    if (Object.keys(validationErrors).length) {
      setErrors(validationErrors)
      return
    }
    setLoading(true)
    setErrors({})
    try {
      await register(form.username.trim(), form.email.trim(), form.password, form.password2)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      if (err.response?.data) {
        setErrors(err.response.data)
      } else {
        setErrors({
          general: ['Could not reach the backend. Check that Django is running on port 8000.']
        })
      }
    } finally {
      setLoading(false)
    }
  }

  const fieldError = (field) => {
    const e = errors[field]
    if (!e) return null
    const messages = Array.isArray(e) ? e : [e]
    return (
      <div className="text-danger small mt-1">
        {messages.map((message, index) => (
          <div key={`${field}-${index}`}>{String(message)}</div>
        ))}
      </div>
    )
  }

  const generalErrors = () => {
    const messages = [
      ...(errors.general || []),
      ...(errors.non_field_errors || []),
      ...(errors.detail ? [errors.detail] : []),
      ...(errors.error ? [errors.error] : []),
    ]
    if (!messages.length) return null
    return (
      <div className="alert alert-danger">
        {messages.map((message, index) => (
          <div key={`general-${index}`}>{String(message)}</div>
        ))}
      </div>
    )
  }

  return (
    <div className="min-vh-100 bg-dark d-flex align-items-center justify-content-center py-5">
      <div className="card bg-secondary text-white shadow-lg" style={{ width: 460 }}>
        <div className="card-body p-5">
          <div className="text-center mb-4">
            <h2 className="fw-bold text-primary">Create Account</h2>
            <p className="text-muted">Join SmartURL Pro today</p>
          </div>
          {success && <div className="alert alert-success">✅ Account created! Redirecting...</div>}
          {generalErrors()}
          <form onSubmit={handleSubmit}>
            {[
              { name:'username',  label:'Username',         type:'text' },
              { name:'email',     label:'Email Address',    type:'email' },
              { name:'password',  label:'Password',         type:'password' },
              { name:'password2', label:'Confirm Password', type:'password' },
            ].map(({ name, label, type }) => (
              <div className="mb-3" key={name}>
                <label className="form-label">{label}</label>
                <input type={type} name={name}
                  className="form-control bg-dark text-white border-secondary"
                  value={form[name]} onChange={handleChange} required />
                {fieldError(name)}
              </div>
            ))}
            <button type="submit" className="btn btn-primary w-100 fw-bold mt-2" disabled={loading}>
              {loading ? 'Creating...' : 'Create Account'}
            </button>
          </form>
          <p className="text-center mt-4 text-muted">
            Have an account? <Link to="/login" className="text-primary">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
