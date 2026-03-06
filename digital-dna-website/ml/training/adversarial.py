"""
Adversarial Robustness Test
Run this to test how well the model withstands evasion attempts.
    python ml/training/adversarial.py
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../backend'))

from services.adversarial_simulator import simulate_attacks
import json, logging

logging.basicConfig(level=logging.INFO)

if __name__ == "__main__":
    print("\n=== Running Adversarial Attack Simulation ===")
    print("Testing 3 strategies: Slow Bot | Typo Injector | Hybrid Adversarial\n")

    results = simulate_attacks(n_per_strategy=100)

    for key, data in results.items():
        if key == "summary":
            continue
        print(f"Strategy: {data['strategy']}")
        print(f"  Detection Rate : {data['detection_rate']}%  {data['verdict']}")
        print(f"  Evasion Rate   : {data['evasion_rate']}%")
        print(f"  Avg Auth Score : {data['avg_authenticity_score']}%")
        print()

    s = results.get("summary", {})
    print(f"Overall Detection Rate : {s.get('overall_detection_rate')}%")
    print(f"Total Attacks Tested   : {s.get('total_attacks')}")
    print(f"Most Evasive Strategy  : {s.get('most_evasive_strategy')}")
