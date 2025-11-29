import google.generativeai as genai
import os

# GANTI DENGAN API KEY BARU ANDA
# (Jangan pakai yang lama karena sudah bocor)
api_key = "AIzaSyDi_U9DnIPuATH_XlQ516s0uv2E4FDd5QA"

genai.configure(api_key=api_key)

print("Mencari model yang tersedia untuk API Key ini...")
try:
    for m in genai.list_models():
        if 'generateContent' in m.supported_generation_methods:
            print(f"- {m.name}")
except Exception as e:
    print(f"Error: {e}")