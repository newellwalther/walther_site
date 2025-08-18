#!/bin/bash
# Simple deploy script for walther.website

git add .
git commit -m "Update site"
git push origin main

echo "🚀 Site deployed to walther.website"



