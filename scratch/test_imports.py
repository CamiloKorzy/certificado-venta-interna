try:
    import pandas as pd
    print("pandas is available")
except Exception as e:
    print("pandas is not available:", e)

try:
    import openpyxl
    print("openpyxl is available")
except Exception as e:
    print("openpyxl is not available:", e)
