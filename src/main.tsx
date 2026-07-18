import "virtual:@downwind/base.css";
import "virtual:@downwind/utils.css";

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Example } from "./Example.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Example />
  </StrictMode>,
);
