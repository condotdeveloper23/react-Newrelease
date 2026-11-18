import { useEffect, useRef } from 'react'
import $ from 'jquery'

window.$ = window.jQuery = $
import 'datatables.net'

function xsrf() {
  const m = document.cookie.match(/XSRF-TOKEN=([^;]+)/)
  return m ? decodeURIComponent(m[1]) : ''
}

export default function ServerDataTable({ url, columns, extraParams, reloadKey, order, scrollY = '50vh' }) {
  const hostRef = useRef(null)
  const tableRef = useRef(null)
  const paramsRef = useRef(extraParams)
  paramsRef.current = extraParams

  useEffect(() => {
    const el = document.createElement('table')
    el.className = 'display cell-border'
    el.style.width = '100%'
    hostRef.current.appendChild(el)

    const table = $(el).DataTable({
      processing: true,
      serverSide: true,
      order: order || [[0, 'desc']],
      scrollX: true,
      scrollY,
      scrollCollapse: true,
      columns,
      ajax: {
        url,
        type: 'POST',
        headers: { 'X-XSRF-TOKEN': xsrf(), Accept: 'application/json' },
        data: (d) => Object.assign(d, paramsRef.current ? paramsRef.current() : {}),
      },
    })
    tableRef.current = table

    return () => {
      try { table.destroy(true) } catch (e) { /* ignore */ }
      if (hostRef.current) hostRef.current.innerHTML = ''
    }
  }, [url, columns, scrollY])

  useEffect(() => {
    if (reloadKey && tableRef.current) tableRef.current.ajax.reload()
  }, [reloadKey])

  return <div ref={hostRef} />
}