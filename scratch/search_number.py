import os
import openpyxl
import pandas as pd
import glob

def search_in_excels():
    print("Searching in Excels...")
    files = glob.glob("**/*.xlsx", recursive=True) + glob.glob("**/*.xls", recursive=True)
    for f in files:
        if "node_modules" in f or "venv" in f: continue
        try:
            xl = pd.ExcelFile(f)
            for sheet in xl.sheet_names:
                df = xl.parse(sheet)
                for col in df.columns:
                    # check if 25859 in any cell
                    matches = df[df[col].astype(str).str.contains("25859|25.859|4473741|4.473.741", na=False)]
                    if not matches.empty:
                        print(f"Match found in file: {f} | Sheet: {sheet} | Column: {col}")
                        print(matches.head())
        except Exception as e:
            # print(f"Error reading {f}: {e}")
            pass

if __name__ == '__main__':
    search_in_excels()
