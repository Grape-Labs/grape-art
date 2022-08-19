import React from "react"
//import "@google/model-viewer/dist/model-viewer-legacy"
import "@google/model-viewer/dist/model-viewer"

export default function ModelViewer(props) {
  // we are also sending the width of the component
  return <model-viewer src={props.src} auto-rotate camera-controls />
}