// src/client/main.js — app entry: mounts hash-based router into #app
import { startRouter } from "./router.js";

const appEl = document.getElementById("app");
startRouter(appEl);
