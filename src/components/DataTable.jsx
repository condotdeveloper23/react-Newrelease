import { useEffect, useRef } from 'react'
import $ from 'jquery'

window.$ = window.jQuery = $
import 'datatables.net'

export default function DataTable({
  columns,
  rows,
  onAction,
  scrollY = '50vh',
  serverSide = false,
  fetchData,
}) {
  const hostRef = useRef(null)
  const actionRef = useRef(onAction)
  actionRef.current = onAction
  const fetchRef = useRef(fetchData)
  fetchRef.current = fetchData

  useEffect(() => {
    const tableEl = document.createElement('table')
    tableEl.className = 'cell-border'
    tableEl.style.width = '100%'
    hostRef.current.appendChild(tableEl)

    const $el = $(tableEl)

    const options = {
      columns,
      scrollX: true,
      scrollY,
      scrollCollapse: true,
    }

    if (serverSide) {
      options.serverSide = true
      options.processing = true
      options.order = []
      options.ajax = (dtParams, callback) => {
        fetchRef.current(dtParams)
          .then(callback)
          .catch(() =>
            callback({ draw: dtParams.draw, recordsTotal: 0, recordsFiltered: 0, data: [] })
          )
      }
    } else {
      options.data = rows
    }

    const table = $el.DataTable(options)

    $el.on('click', '.edit-icon', function () {
      actionRef.current?.($(this).data('id'))
    })

    return () => {
      $el.off('click')
      try { table.destroy(true) } catch (e) { /* ignore */ }
      if (hostRef.current) hostRef.current.innerHTML = ''
    }
  }, serverSide ? [columns, serverSide] : [rows, columns])

  return <div ref={hostRef} />
}