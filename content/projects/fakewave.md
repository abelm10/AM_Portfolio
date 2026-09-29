---
title: "fakewave/"
status: "in development"
tags: ["ml"]
blurb: "A Hindi deepfake-audio detector. Give it a voice clip and it tells you whether a person or a cloning model produced it."
metric:
  value: "4 s"
  label: "windows per clip, with predictions averaged across them"
points:
  - "Turns each clip into a log-mel spectrogram and classifies it with a small CNN"
  - "Built around a dataset trap: if every real clip is a phone recording and every fake is studio-clean, the model learns “noisy = real”"
  - "Training data published as a Kaggle dataset"
  - "Gradio app for uploading or recording a clip"
stack: ["PyTorch", "TorchAudio", "Gradio"]
links:
  - label: "Repo"
    url: "https://github.com/abelm10/FakeWave"
    primary: true
  - label: "Dataset"
    url: "https://www.kaggle.com/datasets/abelmathews2548401/fakewave-fake-vs-real-audio-dataset"
order: 1
---
