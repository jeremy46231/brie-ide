#!/bin/bash

rm -r dist/
bunx google-closure-compiler js/* -O ADVANCED --js_output_file dist/bundle.js
bunx terser dist/bundle.js -o dist/bundle.js --compress
