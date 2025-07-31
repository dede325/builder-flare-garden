import "./global.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";

// Ensure we get the root element
const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error(
    "Failed to find the root element. Make sure there is an element with id='root' in your HTML."
  );
}

// Create root only once and store reference
let root: ReturnType<typeof createRoot>;

function initializeApp() {
  if (!root) {
    root = createRoot(rootElement);
  }
  
  root.render(
    <StrictMode>
      <App />
    </StrictMode>
  );
}

// Initialize the app
initializeApp();

// Handle hot module replacement in development
if (import.meta.hot) {
  import.meta.hot.accept("./App", () => {
    initializeApp();
  });
}
