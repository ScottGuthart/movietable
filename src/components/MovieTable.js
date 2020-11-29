import React from "react"
import { useTable, useGlobalFilter, useSortBy, useFilters } from "react-table"
import { Table, Row, Col } from "react-bootstrap"
import { CgArrowDown, CgArrowUp, CgArrowsV } from "react-icons/cg"

import MovieTableGlobalFilter from "./MovieTableGlobalFilter"
import MovieTablePopularityFilter from "./MovieTablePopularityFilter"
import MovieTableWeightSlider from "./MovieTableWeightSlider"

import movieData from "./movie-data"

const MovieTable = () => {
  const [score_weight, setScore_weight] = React.useState(0.5)
  const columns = React.useMemo(()=> movieData.columns, [])
  const [data, setData] = React.useState(movieData.data)

  React.useEffect(()=>{
    setData(old => { 
      return (old.map((row, index) => {
        return {
          ...row,
          "average score": Math.floor((1-score_weight)*row.userscore + score_weight*row.metascore),
        }
      })
    )})
  }, [score_weight])

  const default_filters = React.useMemo(()=>{
    return [{
      id: "users_rated",
      value: [300, 4075],
    }]
  },[])
  const default_sort = React.useMemo(()=>{
    return [{
      id: "average score",
      desc: true,
    }]
  },[])
  const tableInstance = useTable({ 
    columns, 
    data,
    // manualFilters: true,
    initialState: {
      hiddenColumns: ["link"],
      filters: default_filters,
      sortBy: default_sort,
    },
    autoResetSortBy: false,
    autoResetFilters: false,
  }, useGlobalFilter, useFilters, useSortBy, hooks => {
    hooks.allColumns.push(columns => [
      ...columns,
      {
          accessor: 'average score',
          Header: 'Final Score',
          headerStyle:{whiteSpace:"nowrap"},
          cellStyle:{textAlign:"center"},
      },
    ])
  })
  const {
    getTableProps,
    getTableBodyProps,
    headerGroups,
    rows,
    prepareRow,
    state,
    preGlobalFilteredRows,
    setGlobalFilter,
  } = tableInstance
  return (
  <>
    <Row className="pb-3 pt-3 flex-nowrap d-flex justify-content-space-between">
      <Col xs={6} className="col-xs-6">
        <MovieTableGlobalFilter 
          preGlobalFilteredRows={preGlobalFilteredRows}
          globalFilter={state.globalFilter}
          setGlobalFilter={setGlobalFilter}
        />
      </Col>
      <Col>
        <Row className="d-flex justify-content-center m-auto pb-3">
          <span className="text-secondary" style={{position:"absolute", top:"-1.6rem", fontSize:"0.9rem"}}>
            Popularity
          </span>
          <MovieTablePopularityFilter column={headerGroups[0].headers[2]}/> 
        </Row>
        <Row className="d-flex justify-content-center flex-nowrap m-0 pt-3">
          <span className="text-secondary" style={{position:"absolute", top:"0.9rem", fontSize:"0.9rem"}}>
            Score Bias
          </span>
          <MovieTableWeightSlider weight={score_weight}
           setWeight={setScore_weight}
          />
        </Row>
      </Col>
    </Row>
    <Row>
      <Table {...getTableProps()}>
        <thead>
          {
          headerGroups.map(headerGroup => (
            <tr {...headerGroup.getHeaderGroupProps()}>
              {
                headerGroup.headers.map(column => (
                  <th {...column.getHeaderProps([
                    column.getSortByToggleProps(),
                    {
                      style: column.headerStyle,
                    }
                  ])}>
                    {column.render('Header')}
                    <span>
                      {column.isSorted
                        ? column.isSortedDesc
                          ? <CgArrowDown className="text-primary" />
                          : <CgArrowUp className="text-primary" />
                        : <CgArrowsV className="text-secondary" />}
                    </span>
                  </th>
                ))
              }
            </tr>
          ))}
        </thead>
        <tbody {...getTableBodyProps()}>
          {
          rows.map(row => {
            prepareRow(row)
            return (
              <tr {...row.getRowProps()}>
                {
                  row.cells.map(cell => {
                    return (
                      <td {...cell.getCellProps()} style={cell.column.cellStyle}>
                        {cell.render('Cell')}
                      </td>
                    )
                })}
              </tr>
            )
          })}
        </tbody>
      </Table>
    </Row>
  </>
  )
}

export default MovieTable