#!/bin/bash

cd $(dirname $0)/../

forever start start.js --harmony;
