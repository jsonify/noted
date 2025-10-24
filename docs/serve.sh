#!/bin/bash
# Script to serve the documentation site locally

# Initialize rbenv (required for Ruby 3.1.6)
eval "$(rbenv init - zsh)"

# Install dependencies if needed
echo "Installing dependencies..."
bundle install

# Start Jekyll server
echo "Starting Jekyll server..."
echo "Site will be available at: http://127.0.0.1:4000/noted/"
bundle exec jekyll serve --livereload
