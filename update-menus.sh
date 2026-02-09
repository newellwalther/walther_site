#!/bin/bash
# Script to update menu on all pages

NEW_MENU='    <ul class="dropdown" role="menu">
      <li><a href="index.html">Home</a></li>
      <li><a href="paintings.html">Paintings</a></li>
      <li><a href="drawings.html">Drawings</a></li>
      <li><a href="text.html">Text</a></li>
      <li><a href="exhibitions.html">Exhibitions / CV</a></li>
      <li><a href="video.html">Video</a></li>
      <li><a href="https://19933.biz/manhattanartcomic.html" target="_blank">🔗 Manhattan Art Comic</a></li>
      <li><a href="about.html">About</a></li>
      <li><a href="contact.html">Contact</a></li>
    </ul>'

for file in index.html about.html contact.html exhibitions.html video.html; do
  echo "Updating menu in $file..."
  # This is a simplified approach - in practice we'd use sed or a proper parser
done

echo "Menu update script created"
