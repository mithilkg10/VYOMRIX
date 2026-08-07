import sys
import os

# Ensure the backend directory is in the path so we can import app modules
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

def main():
    # Force ENVIRONMENT=production so the validator triggers
    os.environ["ENVIRONMENT"] = "production"
    
    try:
        from app.core.config import settings
        print("Production configuration validation passed.")
    except Exception as e:
        print(f"Production configuration validation failed:\n{e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
