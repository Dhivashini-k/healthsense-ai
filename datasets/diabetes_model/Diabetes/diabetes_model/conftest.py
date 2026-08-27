import sys
from pathlib import Path

# Add diabetes_model directory to sys.path for pytest discovery from any working directory
sys.path.insert(0, str(Path(__file__).parent))
