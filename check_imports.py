try:
    import google.generativeai as genai
    print("genai: ok")
except ImportError:
    print("genai: missing")
