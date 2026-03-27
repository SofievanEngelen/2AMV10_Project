from pathlib import Path

import pandas as pd

DATA_PATH = (
    Path(__file__).resolve().parent.parent
    / "data"
    / "ultimate_student_productivity_dataset_5000.csv"
)

_df_cache: pd.DataFrame | None = None


def preprocess_data(df: pd.DataFrame) -> pd.DataFrame:
    """
    Clean and standardize the raw student dataset.

    Steps:
    - strip whitespace from column names
    - remove duplicate rows
    - coerce numeric columns and fill missing values with the median
    - clean categorical values and replace missing entries with 'Unknown'
    """
    df = df.copy()

    df.columns = [c.strip() for c in df.columns]
    df = df.drop_duplicates()

    numeric_cols = df.select_dtypes(include=["number"]).columns
    categorical_cols = df.select_dtypes(exclude=["number"]).columns

    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors="coerce")
        df[col] = df[col].fillna(df[col].median())

    for col in categorical_cols:
        df[col] = df[col].astype(str).str.strip()
        df[col] = df[col].replace({"nan": "Unknown"})
        df[col] = df[col].fillna("Unknown")

    return df


def load_data() -> pd.DataFrame:
    """
    Load the dataset once, cache it in memory, and return a copy for safe reuse.
    """
    global _df_cache

    if _df_cache is None:
        df = pd.read_csv(DATA_PATH)
        _df_cache = preprocess_data(df)

    return _df_cache.copy()