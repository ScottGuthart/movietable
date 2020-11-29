import data from './data.json'
import columns from './columns.json'

// import MovieTablePopularityFilter from "./MovieTablePopularityFilter"

const movieData = {
  data: data.map(row=>{
    return {
      ...row,
    }
  }),
  columns: columns
            .map(column=>{
              if (column.accessor === "title"){
                return {
                  ...column,
                  Cell: ({value, row}) => {
                    return (
                      <a href={row.original.link}
                        rel="noreferrer"
                        target="_blank">
                        {value}
                      </a>
                    )
                  },
                }
              }
              else if (column.accessor === "year") {
                return {
                  ...column,
                  headerStyle:{whiteSpace:"nowrap"},
                  filter: 'between',
                }
              }
              else if (column.accessor === "users_rated") {
                return {
                  ...column,
                  headerStyle:{whiteSpace:"nowrap"},
                  cellStyle:{textAlign:"center"},
                  filter: 'between',
                  Cell: ({value}) => value.toLocaleString()
                }
              }
              else if (['userscore', 'metascore'].includes(column.accessor)) {
                return {
                  ...column,
                  headerStyle:{whiteSpace:"nowrap"},
                  cellStyle:{textAlign:"center"},
                }
              }
              return {
                ...column,
                headerStyle:{whiteSpace:"nowrap"},
              }
            }),
}

export default movieData