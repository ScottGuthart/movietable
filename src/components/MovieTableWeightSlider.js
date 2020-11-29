import React from "react"
import { Form, Col } from "react-bootstrap"

const MovieTableWeightSlider = ({weight, setWeight}) => {
  const onChange = e => {
    let newWeight = parseFloat(e.target.value)
    setWeight(newWeight)
  }
  return (<>
    <Col className="pr-3 pl-0 text-right">Users</Col>
    <Col xs={8} className="pr-0 pl-0 col-xs-8" >
      <Form.Control type="range" custom min="0" max="1" step="0.1" 
       onChange={onChange}
       value={weight}/>
    </Col>
    <Col className="pr-0">Critics</Col>
  </>)
}

export default MovieTableWeightSlider