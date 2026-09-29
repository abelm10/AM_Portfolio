---
title: "weather-classification/"
status: "completed"
tags: ["ml"]
blurb: "An image classifier that tells cloudy, rain, shine and sunrise apart from a photo of the sky."
metric:
  value: "69.68%"
  label: "test accuracy from a decision-tree baseline"
points:
  - "937 training and 188 test images across four classes"
  - "RGB → 128×128 → normalised → 49,152 flattened features"
  - "Best F1 on sunrise (0.80) and shine (0.79), weakest on cloudy (0.55)"
stack: ["Python", "OpenCV", "scikit-learn", "NumPy", "Matplotlib"]
links:
  - label: "Repo"
    url: "https://github.com/abelm10/Weather_Classification"
    primary: true
order: 4
---
