#!/bin/sh
if [ -z "$husky_skip_init" ]; then
  husky_skip_init=1
  if [ -f "$0" ]; then
    . "$0"
  fi
fi
