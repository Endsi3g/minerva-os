import whisper
import os
import time

def test_whisper():
    print("--- Whisper ML Environment Test ---")
    
    try:
        print("Loading 'tiny' model (this may take a moment on first run)...")
        start_time = time.time()
        model = whisper.load_model("tiny")
        duration = time.time() - start_time
        print(f"Model loaded successfully in {duration:.2f} seconds.")
        
        # In a real test, we would provide a small audio file.
        # For now, we just verify the library is functional.
        print("Whisper is ready for speech-to-text processing.")
        
    except Exception as e:
        print(f"Error loading Whisper: {e}")

if __name__ == "__main__":
    test_whisper()
