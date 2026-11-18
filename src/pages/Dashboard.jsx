import { useEffect, useState } from 'react'
import api from '../api/axios'

const display = (s) => String(s).replaceAll('_', ' ')

export default function Dashboard() {
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [stack, setStack] = useState([])
  const [content, setContent] = useState(null) // { folders, files }

  useEffect(() => {
    api.get('/spa/dashboard')
      .then(({ data }) => setFolders(data.folders || []))
      .finally(() => setLoading(false))
  }, [])

  const open = async (name, newStack) => {
    setStack(newStack)
    const { data } = await api.get('/spa/dashboard/folder', { params: { folder_name: name } })
    setContent(data)
  }

  const openRoot = (name) => open(name, [name])
  const openSub = (name) => open(name, [...stack, name])

  const back = () => {
    const next = stack.slice(0, -1)
    if (next.length === 0) {
      setStack([])
      setContent(null)
    } else {
      open(next[next.length - 1], next)
    }
  }

  const logDownload = (filename) => {
    api.post('/spa/log-download', {
      filename,
      folder: stack[stack.length - 1],
    }).catch(() => {})
  }

  const current = stack[stack.length - 1]

  return (
    <>
      <h4>
        <i className="fas fa-folder fa-1x header-icon" style={{ color: '#FFB300' }} /> Projects
      </h4>
      <br />

      {stack.length > 0 && (
        <button className="btn btn-secondary mb-3" onClick={back}>← Back</button>
      )}

      {loading && <div>Loading...</div>}

      {!loading && !content && (
        <>
          {folders.length === 0 && (
            <div className="alert alert-warning">You do not have access to any folders.</div>
          )}
          <div className="release-grid">
            {folders.map((f) => (
              <div key={f.id} className="release-card" title={f.name} onClick={() => openRoot(f.name)}>
                <div className="release-icon"><i className="fas fa-folder fa-2x" style={{ color: '#FFB300' }} /></div>
                <div className="release-name fw-semibold">{display(f.name)}</div>
              </div>
            ))}
          </div>
        </>
      )}

      {content && (
        <div className="release-grid">
          {content.folders.map((sub) => {
            const name = sub.split('/').pop()
            return (
              <div key={sub} className="release-card" title={name} onClick={() => openSub(sub)}>
                <div className="release-icon"><i className="fas fa-folder" style={{ color: '#FFB300' }} /></div>
                <div className="release-name">{name}</div>
              </div>
            )
          })}
          {content.files.map((file) => (
            <div key={file.filename} className="release-card" title={file.filename} style={{ cursor: 'default' }}>
              <div className="release-icon"><i className="fas fa-file" style={{ color: '#6c757d' }} /></div>
              <div className="release-name">{file.filename}</div>
              <a href={file.download_url} download className="text-danger d-inline-block mt-2"
                 onClick={() => logDownload(file.filename)}>
                <i className="fas fa-download" />
              </a>
            </div>
          ))}
          {content.folders.length === 0 && content.files.length === 0 && (
            <div className="text-muted">This folder is empty.</div>
          )}
        </div>
      )}
    </>
  )
}