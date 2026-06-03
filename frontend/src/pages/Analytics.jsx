// src/pages/Analytics.jsx

import React, { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../api/axios'

export default function Analytics() {
  const { id } = useParams()
  const [data,    setData]    = useState(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    api.get(`/urls/${id}/analytics/`)
      .then(r => setData(r.data))
      .catch(() => navigate('/dashboard'))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return (
    <div className="d-flex justify-content-center align-items-center bg-dark" style={{ height:'80vh' }}>
      <div className="spinner-border text-primary" style={{ width:'3rem', height:'3rem' }} />
    </div>
  )

  if (!data) return null
  const { url, clicks, total_clicks } = data

  return (
    <div className="bg-dark min-vh-100 text-white p-4">
      <div className="container-fluid">

        <div className="d-flex align-items-center gap-3 mb-4">
          <button className="btn btn-outline-secondary btn-sm" onClick={() => navigate('/dashboard')}>
            ← Back
          </button>
          <h2 className="fw-bold mb-0">📈 Analytics</h2>
        </div>

        <div className="card bg-secondary border-0 shadow mb-4">
          <div className="card-body p-4">
            <div className="row align-items-center">
              <div className="col-md-8">
                <h5 className="fw-bold">{url.title || 'Untitled URL'}</h5>
                <p className="text-muted mb-1 text-break small">{url.original_url}</p>
                <a href={url.short_url} target="_blank" rel="noreferrer" className="text-primary">
                  {url.short_url}
                </a>
                <div className="mt-2 d-flex gap-2 flex-wrap">
                  {url.tags.map(tag => (
                    <span key={tag.id} className="badge" style={{ backgroundColor: tag.color }}>
                      {tag.name}
                    </span>
                  ))}
                </div>
              </div>
              {url.qr_code && (
                <div className="col-md-4 text-center mt-3 mt-md-0">
                  <img src={`http://10.54.228.196:8000${url.qr_code}`} alt="QR"
                    style={{ width:120, background:'white', padding:8, borderRadius:8 }} />
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="row g-3 mb-4">
          {[
            { label:'Total Clicks',  value: total_clicks,  color:'primary' },
            { label:'Last Clicked',  value: url.last_clicked_at
                ? new Date(url.last_clicked_at).toLocaleDateString() : 'Never', color:'info' },
            { label:'Created',       value: new Date(url.created_at).toLocaleDateString(), color:'success' },
            { label:'Status',        value: url.is_active ? 'Active' : 'Disabled',
              color: url.is_active ? 'success' : 'danger' },
          ].map(({ label, value, color }) => (
            <div className="col-sm-6 col-xl-3" key={label}>
              <div className={`card bg-${color} bg-opacity-10 border-${color} text-white`}>
                <div className="card-body text-center py-3">
                  <p className="text-muted mb-1 small">{label}</p>
                  <h4 className="fw-bold mb-0">{value}</h4>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="card bg-secondary border-0 shadow">
          <div className="card-header bg-dark border-0 py-3">
            <h5 className="mb-0">Click History (Last {clicks.length})</h5>
          </div>
          <div className="table-responsive">
            <table className="table table-dark table-hover mb-0">
              <thead>
                <tr><th>#</th><th>Date & Time</th><th>IP Address</th></tr>
              </thead>
              <tbody>
                {clicks.length === 0 ? (
                  <tr><td colSpan="3" className="text-center py-4 text-muted">No clicks yet.</td></tr>
                ) : clicks.map((click, i) => (
                  <tr key={click.id}>
                    <td>{i + 1}</td>
                    <td>{new Date(click.clicked_at).toLocaleString()}</td>
                    <td><code className="text-info">{click.ip_address || 'Unknown'}</code></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  )
}
