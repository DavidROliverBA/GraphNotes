import React from "react";
import ReactDOM from "react-dom/client";
import { Buffer } from "buffer";
import App from "./App";
import "./styles/globals.css";

// Polyfill Buffer for browser (required by gray-matter)
(window as unknown as { Buffer: typeof Buffer }).Buffer = Buffer;

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
