#!/usr/bin/env node
'use strict';

import { main as app} from './../index';

app({
  port: 8000,
  host: "localhost"
}, (...params) => {
  console.log(params);
});