import React from "react"
import { useAsyncDebounce } from "react-table"

const MovieTableGlobalFilter = ({
  preGlobalFilteredRows,
  globalFilter,
  setGlobalFilter,
}) => {
  const count = preGlobalFilteredRows.length
  const [value, setValue] = React.useState(globalFilter)
  const onChange = useAsyncDebounce(value => {
    setGlobalFilter(value || undefined)
  }, 200)

  return (
    <span className="pb-2">
      Search: {' '}
      <input 
        value={value || ""}
        onChange={e => {
          setValue(e.target.value)
          onChange(e.target.value)
        }}
        placeholder={`${count} movies...`}
        style={{
          border: '0',
        }}
      />
    </span>
  )
}

export default MovieTableGlobalFilter