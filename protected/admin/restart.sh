#!/bin/bash

cd $(dirname $0)/../

forever restart start.js --harmony;
