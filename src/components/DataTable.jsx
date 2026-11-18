import { useEffect, useRef } from 'react'
import $ from 'jquery'

window.$ = window.jQuery = $
import 'datatables.net'

export default function DataTable({ columns, rows, onAction, scrollY = '50vh' }) {
  const hostRef = useRef(null)
  const actionRef = useRef(onAction)
  actionRef.current = onAction

  useEffect(() => {
    // React ke bajay hum khud table element banate hain, taaki destroy se React ka DOM na tute
    const tableEl = document.createElement('table')
    tableEl.className = 'cell-border'
    tableEl.style.width = '100%'
    hostRef.current.appendChild(tableEl)

    const $el = $(tableEl)
    const table = $el.DataTable({
      data: rows,
      columns,
      scrollX: true,
      scrollY,
      scrollCollapse: true,
    })

    $el.on('click', '.edit-icon', function () {
      actionRef.current?.($(this).data('id'))
    })

    return () => {
      $el.off('click')
      try { table.destroy(true) } catch (e) { /* ignore */ }
      if (hostRef.current) hostRef.current.innerHTML = ''
    }
  }, [rows, columns])

  return <div ref={hostRef} />
}