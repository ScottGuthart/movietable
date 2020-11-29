import React from "react"
import { Container } from "react-bootstrap"

import MovieTable from "./components/MovieTable"

function App() {

  return (
    <Container className="mt-3">
      <MovieTable />
    </Container>
  );
}

export default App;
