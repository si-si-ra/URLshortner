// src/pages/Dashboard.jsx

import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [urls, setUrls] = useState([])
  const [loading, setLoading] = useState(true)
  const [copied, setCopied] = useState(null)
  const navigate = useNavigate()

  const getShortUrl = (url) => {
    const code = url.active_code || url.custom_alias || url.short_code
    return `${window.location.origin}/s/${code}`
  }

  const fetchData = async () => {
    try {
      const [statsResponse, urlsResponse] = await Promise.all([
        api.get('/dashboard/'),
        api.get('/urls/'),
      ])
      setStats(statsResponse.data)
      setUrls(urlsResponse.data)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleCopy = (url) => {
    navigator.clipboard.writeText(getShortUrl(url))
    setCopied(url.id)
    setTimeout(() => setCopied(null), 2000)
  }

  const handleFavorite = async (id) => {
    const res = await api.post(`/urls/${id}/favorite/`)
    setUrls(urls.map(url => url.id === id ? { ...url, is_favorite: res.data.is_favorite } : url))
  }

  const handleToggle = async (id) => {
    const res = await api.post(`/urls/${id}/toggle/`)
    setUrls(urls.map(url => url.id === id ? { ...url, is_active: res.data.is_active } : url))
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this URL permanently?')) return
    await api.delete(`/urls/${id}/`)
    setUrls(urls.filter(url => url.id !== id))
  }

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center bg-dark" style={{ height: '80vh' }}>
      <div className="spinner-border text-primary" style={{ width: '3rem', height: '3rem' }} />
    </div>
  )

  const cards = [
    { label: 'Total URLs', value: stats?.total_urls, color: 'primary' },
    { label: 'Total Clicks', value: stats?.total_clicks, color: 'success' },
    { label: 'Active URLs', value: stats?.active_urls, color: 'info' },
    { label: 'Favorites', value: stats?.favorite_urls, color: 'warning' },
  ]

  return (
    <div className="bg-dark min-vh-100 text-white p-4">
      <div className="container-fluid">
        <div className="d-flex justify-content-between align-items-center gap-3 mb-4">
          <h2 className="fw-bold mb-0">Dashboard</h2>
          <Link to="/create" className="btn btn-primary fw-bold">Create Short URL</Link>
        </div>

        <div className="row g-3 mb-4">
          {cards.map(({ label, value, color }) => (
            <div className="col-sm-6 col-xl-3" key={label}>
              <div className={`card h-100 bg-${color} bg-opacity-10 border-${color} text-white`}>
                <div className="card-body">
                  <p className="text-muted mb-1 small">{label}</p>
                  <h3 className="fw-bold mb-0">{value ?? 0}</h3>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card bg-secondary border-0 shadow">
          <div className="card-header bg-dark border-0 py-3 d-flex justify-content-between align-items-center">
            <h5 className="mb-0">Your Short URLs</h5>
            <span className="badge bg-primary">{urls.length}</span>
          </div>
          <div className="card-body p-0">
            <div className="table-responsive">
              <table className="table table-dark table-hover mb-0 align-middle">
                <thead>
                  <tr>
                    <th>Title / URL</th>
                    <th>Short URL</th>
                    <th>Clicks</th>
                    <th>Tags</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {urls.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="text-center py-5 text-muted">
                        No URLs yet. <Link to="/create" className="text-primary">Create your first one.</Link>
                      </td>
                    </tr>
                  ) : urls.map(url => (
                    <tr key={url.id}>
                      <td style={{ maxWidth: 220 }}>
                        <div className="fw-semibold text-truncate">{url.title || 'Untitled'}</div>
                        <small className="text-muted text-truncate d-block">{url.original_url}</small>
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <a
                            href={getShortUrl(url)}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary text-decoration-none small text-truncate"
                            style={{ maxWidth: 180 }}
                          >
                            {getShortUrl(url)}
                          </a>
                          <button className="btn btn-sm btn-outline-secondary py-0 px-2" onClick={() => handleCopy(url)}>
                            {copied === url.id ? 'Copied' : 'Copy'}
                          </button>
                        </div>
                      </td>
                      <td><span className="badge bg-primary fs-6">{url.click_count}</span></td>
                      <td>
                        {url.tags.map(tag => (
                          <span key={tag.id} className="badge me-1" style={{ backgroundColor: tag.color }}>
                            {tag.name}
                          </span>
                        ))}
                      </td>
                      <td>
                        <div className="d-flex flex-column gap-1">
                          <span className={`badge ${url.is_active ? 'bg-success' : 'bg-danger'}`}>
                            {url.is_active ? 'Active' : 'Disabled'}
                          </span>
                          {url.is_favorite && <span className="badge bg-warning text-dark">Favorite</span>}
                          {url.is_expired && <span className="badge bg-secondary">Expired</span>}
                          {url.password_hash && <span className="badge bg-info text-dark">Protected</span>}
                        </div>
                      </td>
                      <td><small className="text-muted">{new Date(url.created_at).toLocaleDateString()}</small></td>
                      <td>
                        <div className="d-flex flex-wrap gap-1">
                          <button className="btn btn-sm btn-outline-warning" onClick={() => handleFavorite(url.id)}>
                            Favorite
                          </button>
                          <button className="btn btn-sm btn-outline-info" onClick={() => handleToggle(url.id)}>
                            {url.is_active ? 'Disable' : 'Enable'}
                          </button>
                          <button className="btn btn-sm btn-outline-primary" onClick={() => navigate(`/analytics/${url.id}`)}>
                            Analytics
                          </button>
                          <button className="btn btn-sm btn-outline-danger" onClick={() => handleDelete(url.id)}>
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
