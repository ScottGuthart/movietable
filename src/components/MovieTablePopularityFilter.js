// import "react-input-range/lib/css/index.css"
import React, { useEffect } from "react"
import ReactDOM from "react-dom"
import InputRange from "react-input-range"
import "./input-range.scss"

import { IconContext } from "react-icons"
import { IoPerson } from "react-icons/io5"
import { IoIosPeople } from "react-icons/io"

import { useAsyncDebounce } from "react-table"
// import { IconContext } from "react-icons/lib"

const MovieTablePopularityFilter = ({
  column: {filterValue = [], preFilteredRows, setFilter, id}
}) => {
  const [min, max] = React.useMemo(() => {
    let min = preFilteredRows.length ? preFilteredRows[0].values[id] : 0
    let max = preFilteredRows.length ? preFilteredRows[0].values[id] : 0
    preFilteredRows.forEach(row => {
      min = Math.min(row.values[id], min)
      max = Math.max(row.values[id], max)
    })
    return [min, max]
  }, [id, preFilteredRows])

  useEffect(()=>{
    ReactDOM.render(
      (<IconContext.Provider value={{ style:{
        fontSize: "0.8rem",
        verticalAlign: "middle",
        } }}>
        <IoPerson />
      </IconContext.Provider>)
      ,
      document.querySelector('span.input-range__label.input-range__label--min')
    )
    ReactDOM.render(
      (<IconContext.Provider value={{ style:{
        fontSize: "1.6rem",
        verticalAlign: "middle",
        } }}>
        <IoIosPeople /> 
      </IconContext.Provider>),
      document.querySelector('.input-range__label.input-range__label--max')
    )
  },[])
  
  const [value, setValue] = React.useState(filterValue)
  const onChange = useAsyncDebounce(value => {
    setFilter(value)
  }, 200)
  
  return (
    <InputRange
        step={parseInt((max-min)/100, 10)}
        formatLabel={value=> {}}
        maxValue={max}
        minValue={min}
        value={{
          min:  value[0],
          max: value[1],
        }}
        onChange={value => {
          setValue([parseInt(value.min, 10), parseInt(value.max, 10)])
          onChange([parseInt(value.min, 10), parseInt(value.max, 10)])
        }}
    />
  );
}
export default MovieTablePopularityFilter