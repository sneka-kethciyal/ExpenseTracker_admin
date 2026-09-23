import React, { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Inbox, Search } from 'lucide-react';
import './DataTable.css';

export default function DataTable({
  columns = [],
  data = [],
  loading = false,
  emptyMessage = 'No records found',
  searchable = true,
  searchPlaceholder = 'Search records...',
  pageSize = 10,
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Search filtering across all column values
  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return data;
    const query = searchQuery.toLowerCase().trim();
    return data.filter((item) =>
      columns.some((col) => {
        const val = col.accessor ? item[col.accessor] : null;
        if (val === null || val === undefined) return false;
        return String(val).toLowerCase().includes(query);
      })
    );
  }, [data, columns, searchQuery]);

  // Pagination calculation
  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;
  const paginatedData = useMemo(() => {
    const startIdx = (currentPage - 1) * pageSize;
    return filteredData.slice(startIdx, startIdx + pageSize);
  }, [filteredData, currentPage, pageSize]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  return (
    <div className="datatable-wrapper">
      {searchable && (
        <div className="datatable-toolbar">
          <div className="datatable-search">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setCurrentPage(1);
              }}
            />
          </div>
          <div className="datatable-total-badge">
            Total: {filteredData.length}
          </div>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              {columns.map((col, idx) => (
                <th key={col.key || col.accessor || idx} style={col.headerStyle}>
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, rIdx) => (
                <tr key={`skel-${rIdx}`}>
                  {columns.map((_, cIdx) => (
                    <td key={`skel-cell-${cIdx}`}>
                      <div className="skeleton" style={{ height: '20px', width: '80%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : paginatedData.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="datatable-empty-cell">
                  <div className="empty-state">
                    <Inbox size={36} className="empty-icon" />
                    <p>{emptyMessage}</p>
                  </div>
                </td>
              </tr>
            ) : (
              paginatedData.map((row, rIdx) => (
                <tr key={row.id || rIdx}>
                  {columns.map((col, cIdx) => (
                    <td key={col.key || col.accessor || cIdx} style={col.cellStyle}>
                      {col.render
                        ? col.render(row)
                        : col.accessor
                        ? row[col.accessor] ?? '--'
                        : null}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      {!loading && filteredData.length > pageSize && (
        <div className="datatable-pagination">
          <span className="pagination-info">
            Showing {(currentPage - 1) * pageSize + 1} to{' '}
            {Math.min(currentPage * pageSize, filteredData.length)} of{' '}
            {filteredData.length} records
          </span>
          <div className="pagination-actions">
            <button
              type="button"
              className="pagination-btn"
              disabled={currentPage === 1}
              onClick={() => handlePageChange(currentPage - 1)}
              aria-label="Previous Page"
            >
              <ChevronLeft size={16} />
            </button>
            <span className="pagination-current-page">
              Page {currentPage} of {totalPages}
            </span>
            <button
              type="button"
              className="pagination-btn"
              disabled={currentPage === totalPages}
              onClick={() => handlePageChange(currentPage + 1)}
              aria-label="Next Page"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
