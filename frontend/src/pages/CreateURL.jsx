// src/pages/CreateURL.jsx

import React, { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { backendBaseUrl } from '../api/axios'

const emptyForm = {
  original_url: '',
  custom_alias: '',
  title: '',
  notes: '',
  password: '',
  expires_at: '',
  is_favorite: false,
  tag_ids: [],
}

export default function CreateURL() {
  const [form, setForm] = useState(emptyForm)
  const [tags, setTags] = useState([])
  const [errors, setErrors] = useState({})
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState(null)
  const [copied, setCopied] = useState(false)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/tags/').then(r => setTags(r.data)).catch(() => {})
  }, [])

  const shortUrl = useMemo(() => {
    if (!created) return ''
    const code = created.active_code || created.custom_alias || created.short_code
    return `${window.location.origin}/s/${code}`
  }, [created])

  const qrUrl = useMemo(() => {
    if (!created?.qr_code) return ''
    return created.qr_code.startsWith('http')
      ? created.qr_code
      : `${backendBaseUrl}${created.qr_code}`
  }, [created])

  const handleChange = e => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }))
  }

  const handleTagToggle = id => {
    setForm(prev => ({
      ...prev,
      tag_ids: prev.tag_ids.includes(id)
        ? prev.tag_ids.filter(tagId => tagId !== id)
        : [...prev.tag_ids, id],
    }))
  }

  const handleSubmit = async e => {
    e.preventDefault()
    setLoading(true)
    setErrors({})
    setCopied(false)

    const payload = { ...form }
    if (!payload.custom_alias) delete payload.custom_alias
    if (!payload.password) delete payload.password
    if (!payload.expires_at) delete payload.expires_at
    if (!payload.notes) delete payload.notes
    if (!payload.title) delete payload.title

    try {
      const res = await api.post('/urls/', payload)
      setCreated(res.data)
    } catch (err) {
      setErrors(err.response?.data || {})
    } finally {
      setLoading(false)
    }
  }

  const copyShortUrl = async () => {
    await navigator.clipboard.writeText(shortUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 1800)
  }

  const resetForm = () => {
    setCreated(null)
    setCopied(false)
    setForm(emptyForm)
  }

  if (created) return (
    <div className="bg-dark min-vh-100 text-white p-4">
      <div className="container py-4" style={{ maxWidth: 860 }}>
        <div className="card bg-secondary border-success border-2 shadow-lg">
          <div className="card-body p-4 p-md-5">
            <div className="d-flex flex-column flex-md-row gap-4 align-items-md-start">
              <div className="flex-grow-1">
                <p className="text-success fw-semibold mb-2">URL created</p>
                <h2 className="fw-bold mb-2">Your short link is ready</h2>
                <p className="text-muted mb-4">
                  Use this link anywhere. It will route through the app and track clicks.
                </p>

                <label className="form-label fw-semibold">Short URL</label>
                <div className="input-group mb-3">
                  <input className="form-control bg-dark text-white border-secondary" value={shortUrl} readOnly />
                  <button className="btn btn-primary" type="button" onClick={copyShortUrl}>
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <div className="d-flex flex-wrap gap-2">
                  <a className="btn btn-outline-primary" href={shortUrl} target="_blank" rel="noreferrer">
                    Open link
                  </a>
                  <button className="btn btn-primary" onClick={resetForm}>Create another</button>
                  <button className="btn btn-outline-secondary" onClick={() => navigate('/dashboard')}>
                    Dashboard
                  </button>
                </div>
              </div>

              {qrUrl && (
                <div className="text-center">
                  <p className="text-muted small mb-2">QR code</p>
                  <img
                    src={qrUrl}
                    alt="QR code for short URL"
                    style={{ width: 180, background: 'white', padding: 10, borderRadius: 8 }}
                  />
                  <div className="mt-3">
                    <a href={qrUrl} download className="btn btn-sm btn-outline-success">Download QR</a>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="bg-dark min-vh-100 text-white p-4">
      <div className="container py-4" style={{ maxWidth: 920 }}>
        <div className="d-flex flex-column flex-md-row justify-content-between gap-3 mb-4">
          <div>
            <p className="text-primary fw-semibold mb-2">Create</p>
            <h2 className="fw-bold mb-2">New short URL</h2>
            <p className="text-muted">Shorten, protect, expire, and organize links from one place.</p>
          </div>
          <button type="button" className="btn btn-outline-secondary align-self-md-start" onClick={() => navigate('/dashboard')}>
            Back to dashboard
          </button>
        </div>

        <div className="card bg-secondary border-0 shadow">
          <div className="card-body p-4 p-md-5">
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="form-label fw-semibold">
                  Original URL <span className="text-danger">*</span>
                </label>
                <input
                  type="url"
                  name="original_url"
                  className="form-control bg-dark text-white border-secondary"
                  placeholder="https://example.com/very/long/url"
                  value={form.original_url}
                  onChange={handleChange}
                  required
                />
                {errors.original_url && <div className="text-danger small mt-1">{errors.original_url}</div>}
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Title</label>
                  <input
                    type="text"
                    name="title"
                    className="form-control bg-dark text-white border-secondary"
                    placeholder="Campaign link"
                    value={form.title}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Custom alias</label>
                  <div className="input-group">
                    <span className="input-group-text bg-dark text-muted border-secondary">/s/</span>
                    <input
                      type="text"
                      name="custom_alias"
                      className="form-control bg-dark text-white border-secondary"
                      placeholder="my-brand"
                      value={form.custom_alias}
                      onChange={handleChange}
                    />
                  </div>
                  {errors.custom_alias && <div className="text-danger small mt-1">{errors.custom_alias}</div>}
                </div>
              </div>

              <div className="row g-3 mb-4">
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Password</label>
                  <input
                    type="password"
                    name="password"
                    className="form-control bg-dark text-white border-secondary"
                    placeholder="Protect this link"
                    value={form.password}
                    onChange={handleChange}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fw-semibold">Expiry date</label>
                  <input
                    type="datetime-local"
                    name="expires_at"
                    className="form-control bg-dark text-white border-secondary"
                    value={form.expires_at}
                    onChange={handleChange}
                  />
                  {errors.expires_at && <div className="text-danger small mt-1">{errors.expires_at}</div>}
                </div>
              </div>

              <div className="mb-4">
                <label className="form-label fw-semibold">Notes</label>
                <textarea
                  name="notes"
                  rows="3"
                  className="form-control bg-dark text-white border-secondary"
                  placeholder="Private notes about this link"
                  value={form.notes}
                  onChange={handleChange}
                />
              </div>

              {tags.length > 0 && (
                <div className="mb-4">
                  <label className="form-label fw-semibold">Tags</label>
                  <div className="d-flex flex-wrap gap-2">
                    {tags.map(tag => (
                      <button
                        key={tag.id}
                        type="button"
                        className={`btn btn-sm ${form.tag_ids.includes(tag.id) ? 'text-white' : 'btn-outline-secondary'}`}
                        style={form.tag_ids.includes(tag.id) ? { backgroundColor: tag.color, borderColor: tag.color } : {}}
                        onClick={() => handleTagToggle(tag.id)}
                      >
                        {tag.name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="form-check mb-4">
                <input
                  type="checkbox"
                  name="is_favorite"
                  id="is_favorite"
                  className="form-check-input"
                  checked={form.is_favorite}
                  onChange={handleChange}
                />
                <label htmlFor="is_favorite" className="form-check-label">Add to favorites</label>
              </div>

              <div className="d-flex flex-wrap gap-3">
                <button type="submit" className="btn btn-primary px-5 fw-bold" disabled={loading}>
                  {loading ? 'Creating...' : 'Create short URL'}
                </button>
                <button type="button" className="btn btn-outline-secondary" onClick={() => navigate('/dashboard')}>
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}
