import { LightTheme, BaseProvider } from "baseui";
import { startOfDay } from "date-fns";
import React from "react";
import ReactDOM from "react-dom";
import { Provider as StyletronProvider } from "styletron-react";
import { Client as Styletron } from "styletron-engine-atomic";

import App from "./App";
import "./index.css";

const engine = new Styletron();

ReactDOM.render(
  <StyletronProvider value={engine}>
    <BaseProvider theme={LightTheme}>
      <App date={startOfDay(new Date())} />
    </BaseProvider>
  </StyletronProvider>,
  document.getElementById("root")
);
