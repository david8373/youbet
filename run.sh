#!/bin/bash

while true; do
    NOW=`date +%Y-%m-%d-%H-%M-%S`
    LOGFILE="/home/ubuntu/youbet/logs/log_$NOW.txt"
    echo "node youbet.js > $LOGFILE 2>&1"
    node youbet.js > "$LOGFILE" 2>&1
done

