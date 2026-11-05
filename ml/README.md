# Machine Learning Workspace

This folder manages data collection, exploratory data analysis, algorithm training, validation, and exported models for gas Z-factor estimation.

## Structure

1. data: Raw and processed PVT datasets from literature.
2. notebooks: Jupyter notebooks for data cleaning, training, and model evaluation.
3. models: Exported trained models saved for deployment in the server or web app.

## Evaluation Metrics

Model performance is evaluated against conventional correlations (Standing-Katz, Hall-Yarborough, Dranchuk-Abu-Kassem) using:
- Mean Absolute Error (MAE)
- Root Mean Squared Error (RMSE)
- Coefficient of Determination (R-squared)

