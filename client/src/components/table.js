import React, { useState } from 'react';
import './table.css'

function Table({ columns, data }) {
  const [sortedColumn, setSortedColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [filterColumn, setFilterColumn] = useState('');
  const [filterValue, setFilterValue] = useState('');

  // Sorting function
  const sortByColumn = (columnName) => {
    if (sortedColumn === columnName) {
      // Toggle sorting direction if the same column is clicked again
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      // Default to ascending order when sorting a new column
      setSortedColumn(columnName);
      setSortDirection('asc');
    }
  };

  // Filtering function
  const filterData = () => {
    return data.filter((row) => {
      if (!filterColumn || !filterValue) return true;

      const cellValue = row[filterColumn];
      return cellValue && cellValue.toString().toLowerCase().includes(filterValue.toLowerCase());
    });
  };

  // Apply sorting and filtering
  const filteredData = filterData().sort((a, b) => {
    if (sortedColumn) {
      const aValue = a[sortedColumn];
      const bValue = b[sortedColumn];

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return bValue > aValue ? 1 : -1;
      }
    }
    return 0;
  });

  return (
    <div className="table-container">
      <div className="filter-section">
        <select
          onChange={(e) => setFilterColumn(e.target.value)}
          value={filterColumn}
        >
          <option value="">--Select Column--</option>
          {columns.map((col) => (
            <option key={col.field} value={col.field}>
              {col.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          placeholder="Filter Value"
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
        />
      </div>
      <table>
        <thead>
          <tr>
            {columns.map((col) => (
              <th key={col.field}>
                {col.label}{' '}
                {sortedColumn === col.field ? (
                  sortDirection === 'asc' ? (
                    <span className="sort-arrow" onClick={() => sortByColumn(col.field)}>▲</span>
                  ) : (
                    <span className="sort-arrow" onClick={() => sortByColumn(col.field)}>▼</span>
                  )
                ) : (
                  <span className="sort-arrow" onClick={() => sortByColumn(col.field)}>↕</span>
                )}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row, index) => (
            <tr key={index}>
              {columns.map((col) => (
                <td key={col.field}>{row[col.field]}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default Table;
