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

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value })

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    try {
      await register(form.username, form.email, form.password, form.password2)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 2000)
    } catch (err) {
      setErrors(err.response?.data || {})
    } finally {
      setLoading(false)
    }
  }

  const fieldError = (field) => {
    const e = errors[field]
    if (!e) return null
    return <div className="text-danger small mt-1">{Array.isArray(e) ? e[0] : e}</div>
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
          {errors.non_field_errors && <div className="alert alert-danger">{errors.non_field_errors[0]}</div>}
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