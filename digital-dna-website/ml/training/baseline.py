"""
Baseline Model Trainer
Run this to train the logistic regression baseline for comparison.
    python ml/training/baseline.py
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../backend'))

from services.baseline_comparison import train_baseline, get_benchmark_report
import json, logging

logging.basicConfig(level=logging.INFO)

if __name__ == "__main__":
    print("\n=== Training Baseline Logistic Regression ===")
    results = train_baseline()
    print(json.dumps(results, indent=2))

    print("\n=== Full Benchmark Comparison Table ===")
    report = get_benchmark_report()
    for r in report["benchmark_results"]:
        marker = "🏆" if r["highlight"] else "  "
        print(f"{marker} {r['model']:<35} Detection: {r['detection_rate']:<8} F1: {r['f1_score']}")

    print("\n=== Improvement Over Simple Rules ===")
    for k, v in report["improvement_over_baseline"].items():
        print(f"  {k}: {v}")
