
import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../api/axios'
import DataTable from '../components/DataTable'

export default function AuditTrialReport() {
    const [users, setUsers] = useState([])
    const [selectedUsers, setSelectedUsers] = useState([])

    const [fromDate, setFromDate] = useState('')
    const [toDate, setToDate] = useState('')

    const [rows, setRows] = useState([])
    const [auditTrailsCount, setAuditTrailsCount] = useState(0)

    const [loading, setLoading] = useState(false)
    const [searching, setSearching] = useState(false)
    const [error, setError] = useState('')

    // Load initial report data
    useEffect(() => {
        loadInitialData()
    }, [])

    const loadInitialData = async () => {
        try {
            setLoading(true)

            const response = await api.get('/spa/report/audit-trial')

            const data = response.data

            setUsers(data.users || [])
            setFromDate(data.fromDate || '')
            setToDate(data.toDate || '')
            setSelectedUsers(data.userId || [])

        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to load report data.'
            )
        } finally {
            setLoading(false)
        }
    }

    // Select / deselect all users
    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedUsers(users.map(user => String(user.id)))
        } else {
            setSelectedUsers([])
        }
    }

    // Individual user selection
    const handleUserChange = (userId, checked) => {
        const id = String(userId)

        setSelectedUsers(prev => {
            if (checked) {
                return prev.includes(id) ? prev : [...prev, id]
            }

            return prev.filter(item => item !== id)
        })
    }

    const allSelected =
        users.length > 0 &&
        selectedUsers.length === users.length

    // Search report
    const handleSearch = async (e) => {
        e.preventDefault()

        setError('')

        if (!fromDate || !toDate) {
            setError('Please fill all the required fields.')
            return
        }

        if (fromDate > toDate) {
            setError('From date must be less than to date.')
            return
        }

        if (selectedUsers.length === 0) {
            setError('Please select user.')
            return
        }

        try {
            setSearching(true)

            const response = await api.post(
                '/spa/report/search-audit-trail',
                {
                    from_date: fromDate,
                    to_date: toDate,
                    user_id: selectedUsers,
                }
            )

            const data = response.data

            setAuditTrailsCount(data.auditTrailsCount || 0)
            setRows(data.rows || [])

        } catch (err) {
            setError(
                err.response?.data?.message ||
                'Unable to search audit report.'
            )

            setRows([])
            setAuditTrailsCount(0)

        } finally {
            setSearching(false)
        }
    }

    // DataTable columns
    const columns = useMemo(() => [
        {
            data: null,
            title: 'Sr. No.',
            width: '10%',
            orderable: false,
            render: (data, type, row, meta) => meta.row + 1,
        },
        {
            data: 'email',
            title: 'Email',
            width: '15%',
        },
        {
            data: 'accessed_at',
            title: 'DateTime',
            width: '15%',
        },
        {
            data: 'reason',
            title: 'Reason',
        },
    ], [])

    // PDF download
    const handlePdfDownload = () => {
        const usersJson = JSON.stringify(selectedUsers)

        const url =
            `/report/audit_trial_user_report_pdf/` +
            `${encodeURIComponent(fromDate)}/` +
            `${encodeURIComponent(toDate)}/` +
            `${encodeURIComponent(usersJson)}`

        window.location.href = url
    }

    return (
        <>
            {/* Page Heading */}
            <div className="row mb-3">
                <div className="col-lg-6">
                    <h4 className="dashboard-heading">
                        Audit Trial User Reports
                    </h4>
                </div>

                <div className="col-lg-6 dashurl">
                    <Link to="/report" className="text-dark">
                        Report
                    </Link>

                    <span className="text-danger">
                        {' '} /Audit Trial Report
                    </span>
                </div>
            </div>

            {/* Filter Section */}
            <div className="row" style={{ padding: '10px' }}>
                <div
                    className="col-lg-12 card shadow p-4"
                    style={{
                        border: '1px solid #ed3237',
                    }}
                >
                    <form onSubmit={handleSearch}>
                        <div className="row">

                            {/* Date Fields */}
                            <div className="col-md-6">
                                <div className="row">

                                    <div className="col-md-12">
                                        <label>
                                            From <span className="text-danger">*</span>
                                        </label>

                                        <input
                                            type="datetime-local"
                                            className="form-control mb-2"
                                            value={fromDate}
                                            onChange={(e) => setFromDate(e.target.value)}
                                            required
                                            autoComplete="off"
                                        />
                                    </div>

                                    <div className="col-md-12">
                                        <label>
                                            To <span className="text-danger">*</span>
                                        </label>

                                        <input
                                            type="datetime-local"
                                            className="form-control mb-2"
                                            value={toDate}
                                            onChange={(e) => setToDate(e.target.value)}
                                            required
                                            autoComplete="off"
                                        />
                                    </div>

                                </div>
                            </div>

                            {/* Users */}
                            <div className="col-md-6">
                                <div
                                    className="row"
                                    style={{
                                        maxHeight: '150px',
                                        overflowY: 'auto',
                                    }}
                                >
                                    <div className="col-md-12">
                                        <div className="row">

                                            <div
                                                className="col-2"
                                                style={{ fontWeight: 'bold' }}
                                            >
                                                Users
                                            </div>

                                            <div
                                                className="col-10"
                                                style={{ fontWeight: 'bold' }}
                                            >
                                                All&nbsp;

                                                <input
                                                    type="checkbox"
                                                    checked={allSelected}
                                                    onChange={(e) =>
                                                        handleSelectAll(e.target.checked)
                                                    }
                                                />
                                            </div>

                                        </div>
                                    </div>

                                    <div className="col-md-12">
                                        <br />
                                    </div>

                                    <div className="col-md-12">
                                        <div className="row">

                                            {users.map(user => (
                                                <div
                                                    className="col-md-12"
                                                    key={user.id}
                                                >
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedUsers.includes(
                                                            String(user.id)
                                                        )}
                                                        onChange={(e) =>
                                                            handleUserChange(
                                                                user.id,
                                                                e.target.checked
                                                            )
                                                        }
                                                    />

                                                    &nbsp;

                                                    <label
                                                        style={{
                                                            fontWeight: 100,
                                                        }}
                                                    >
                                                        {user.name} - {user.email}
                                                    </label>
                                                </div>
                                            ))}

                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {error && (
                            <div className="alert alert-danger mt-2">
                                {error}
                            </div>
                        )}

                        <button
                            type="submit"
                            className="btn btn-danger"
                            disabled={searching || loading}
                        >
                            {searching ? 'Searching...' : 'Search Report'}
                        </button>

                    </form>
                </div>
            </div>

            {/* Report Table */}
            <div className="row mt-3">

                {auditTrailsCount > 0 && (
                    <div className="col-12 mb-2">
                        <button
                            type="button"
                            className="btn btn-danger"
                            onClick={handlePdfDownload}
                        >
                            PDF
                        </button>
                    </div>
                )}

                <div className="col-12">
                    <div className="table-responsive">

                        {auditTrailsCount > 0 ? (
                            <DataTable
                                columns={columns}
                                rows={rows}
                            />
                        ) : (
                            <table className="cell-border w-100">
                                <thead>
                                    <tr>
                                        <td>Sr. No.</td>
                                        <td>Email</td>
                                        <td>DateTime</td>
                                        <td>Reason</td>
                                    </tr>
                                </thead>
                                <tbody>
                                    {!loading && (
                                        <tr>
                                            <td colSpan="4" className="text-center">
                                                No records found
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        )}

                    </div>
                </div>
            </div>
        </>
    )
}
