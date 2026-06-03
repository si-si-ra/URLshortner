// src/pages/CreateURL.jsx

import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function CreateURL() {
  const [form, setForm] = useState({
    original_url:'', custom_alias:'', title:'', notes:'',
    password:'', expires_at:'', is_favorite:false, tag_ids:[]
  })
  const [tags,    setTags]    = useState([])
  const [errors,  setErrors]  = useState({})
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/tags/').then(r => setTags(r.data)).catch(() => {})
  }, [])

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm({ ...form, [name]: type === 'checkbox' ? checked : value })
  }

  const handleTagToggle = id => {
    setForm(p => ({
      ...p,
      tag_ids: p.tag_ids.includes(id) ? p.tag_ids.filter(t => t !== id) : [...p.tag_ids, id]
    }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    const payload = { ...form }
    if (!payload.custom_alias) delete payload.custom_alias
    if (!payload.password)     delete payload.password
    if (!payload.expires_at)   delete payload.expires_at
    if (!payload.notes)        delete payload.notes
    try {
      const res = await api.post('/urls/', payload)
      setCreated(res.data)
    } catch (err) {
      setErrors(err.response?.data || {})
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setCreated(null)
    setForm({ original_url:'', custom_alias:'', title:'', notes:'',
              password:'', expires_at:'', is_favorite:false, tag_ids:[] })
  }

  if (created) return (
    <div className="bg-dark min-vh-100 text-white p-4 d-flex align-items-center justify-content-center">
      <div className="card bg-secondary border-success border-2 shadow-lg" style={{ maxWidth:560 }}>
        <div className="card-body p-5 text-center">
          <div style={{ fontSize:'3rem' }}>✅</div>
          <h3 className="fw-bold text-success mt-2 mb-1">URL Created!</h3>
          <p className="text-muted mb-4">Your short URL is ready</p>
          <div className="bg-dark rounded p-3 mb-4">
            <p className="text-muted small mb-1">Short URL</p>
            <a href={created.short_url} target="_blank" rel="noreferrer"
              className="text-primary fw-bold fs-5">{created.short_url}</a>
            <button className="btn btn-sm btn-outline-primary ms-3"
              onClick={() => navigator.clipboard.writeText(created.short_url)}>
              📋 Copy
            </button>
          </div>
          {created.qr_code && (
            <div className="mb-4">
              <p className="text-muted small mb-2">QR Code</p>
              <img src={`http://10.54.228.196:8000${created.qr_code}`} alt="QR"
                style={{ width:180, background:'white', padding:8, borderRadius:8 }} />
              <div className="mt-2">
                <a href={`http://10.54.228.196:8000${created.qr_code}`} download
                  className="btn btn-sm btn-outline-success">⬇ Download QR</a>
              </div>
            </div>
          )}
          <div className="d-flex gap-3 justify-content-center">
            <button className="btn btn-primary" onClick={resetForm}>➕ Create Another</button>
            <button className="btn btn-outline-light" onClick={() => navigate('/dashboard')}>
              📊 Dashboard
            </button>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="bg-dark min-vh-100 text-white p-4">
      <div className="container" style={{ maxWidth:700 }}>
        <h2 className="fw-bold mb-4">➕ Create Short URL</h2>
        <div className="card bg-secondary border-0 shadow">
          <div className="card-body p-4">
            <form onSubmit={handleSubmit}>

              <div className="mb-4">
                <label className="form-label fw-semibold">
                  Original URL <span className="text-danger">*</span>
                </label>
                <input type="url" name="original_url"
                  className="form-control bg-dark text-white border-secondary"
                  placeholder="https://example.com/very/long/url"
                  value={form.original_url} onChange={handleChange} required />
                {errors.original_url && <div className="text-danger small mt-1">{errors.original_url}</div>}
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Title (optional)</label>
                  <input type="text" name="title"
                    className="form-control bg-dark text-white border-secondary"
                    placeholder="My Campaign Link"
                    value={form.title} onChange={handleChange} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Custom Alias (optional)</label>
                  <div className="input-group">
                    <span className="input-group-text bg-dark text-muted border-secondary">/s/</span>
                    <input type="text" name="custom_alias"
                      className="form-control bg-dark text-white border-secondary"
                      placeholder="my-brand"
                      value={form.custom_alias} onChange={handleChange} />
                  </div>
                  {errors.custom_alias && <div className="text-danger small mt-1">{errors.custom_alias}</div>}
                </div>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">🔒 Password (optional)</label>
                  <input type="password" name="password"
                    className="form-control bg-dark text-white border-secondary"
                    placeholder="Protect this link"
                    value={form.password} onChange={handleChange} />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">⏰ Expiry Date (optional)</label>
                  <input type="datetime-local" name="expires_at"
                    className="form-control bg-dark text-white border-secondary"
                    value={form.expires_at} onChange={handleChange} />
                  {errors.expires_at && <div className="text-danger small mt-1">{errors.expires_at}</div>}
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold">Notes (optional)</label>
                <textarea name="notes" rows="2"
                  className="form-control bg-dark text-white border-secondary"
                  placeholder="Private notes about this link..."
                  value={form.notes} onChange={handleChange} />
              </div>

              {tags.length > 0 && (
                <div className="mb-4">
                  <label className="form-label fw-semibold">Tags</label>
                  <div className="d-flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <button key={tag.id} type="button"
                        className={`btn btn-sm ${form.tag_ids.includes(tag.id) ? 'text-white' : 'btn-outline-secondary'}`}
                        style={form.tag_ids.includes(tag.id)
                          ? { backgroundColor: tag.color, borderColor: tag.color }
                          : {}}
                        onClick={() => handleTagToggle(tag.id)}>
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="mb-4 form-check">
                <input type="checkbox" name="is_favorite" id="is_favorite"
                  className="form-check-input"
                  checked={form.is_favorite} onChange={handleChange} />
                <label htmlFor="is_favorite" className="form-check-label">⭐ Add to favorites</label>
              </div>

              <div className="d-flex gap-3">
                <button type="submit" className="btn btn-primary px-5 fw-bold" disabled={loading}>
                  {loading ? 'Creating...' : '⚡ Create Short URL'}
                </button>
                <button type="button" className="btn btn-outline-secondary"
                  onClick={() => navigate('/dashboard')}>Cancel</button>
              </div>

            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
