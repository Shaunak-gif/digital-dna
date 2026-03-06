"""
Digital DNA – ML Training Pipeline
=====================================
Trains two models:
1. Isolation Forest (anomaly detection, no labels needed)
2. LSTM sequence classifier (supervised, requires labeled data)

Generates synthetic behavioral data for bootstrapping.
In production, replace with real collected session data.

Usage:
    python train.py --mode unsupervised   # Train Isolation Forest only
    python train.py --mode supervised     # Train LSTM (needs labeled data)
    python train.py --mode all            # Train both
"""

import argparse
import os
import json
import numpy as np
import joblib
import logging
from datetime import datetime

logging.basicConfig(level=logging.INFO, format='%(asctime)s %(levelname)s %(message)s')
logger = logging.getLogger(__name__)

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "models")
os.makedirs(OUTPUT_DIR, exist_ok=True)


# ─────────────────────────────────────────────────────────────
# 1. SYNTHETIC DATA GENERATION
# ─────────────────────────────────────────────────────────────

def generate_human_session(n=1) -> np.ndarray:
    """
    Simulate behavioral features of a genuine human user.
    Distribution tuned from published biometric research.
    """
    sessions = []
    for _ in range(n):
        avg_iki = np.random.normal(280, 80)          # 150-600ms typical
        iki_var = np.random.normal(18000, 5000)       # High variance
        iki_std = np.sqrt(max(iki_var, 0))
        iki_cv = iki_std / max(avg_iki, 1)
        iki_skewness = np.random.normal(0.8, 0.3)    # Slight right skew
        backspace_rate = np.abs(np.random.normal(0.12, 0.05))
        burst_ratio = np.abs(np.random.normal(0.05, 0.03))
        paste_count = max(0, int(np.random.poisson(0.5)))
        paste_dominance = np.random.uniform(0, 0.15)
        copy_count = max(0, int(np.random.poisson(0.3)))
        paste_volume = paste_count * np.random.randint(0, 30)
        edit_bursts = max(0, int(np.random.normal(6, 3)))
        avg_mouse_speed = np.random.normal(150, 50)
        mouse_speed_var_norm = np.random.uniform(0.4, 0.9)
        scroll_events = int(np.random.poisson(8))
        session_duration = np.random.normal(180, 60)
        events_per_sec = np.random.normal(3.5, 1.0)
        typing_naturalness = np.random.uniform(0.55, 0.95)
        mouse_naturalness = np.random.uniform(0.5, 0.9)
        total_keystrokes = max(30, int(np.random.normal(200, 60)))

        sessions.append([
            avg_iki, iki_var, iki_std, iki_cv, iki_skewness,
            backspace_rate, burst_ratio, paste_count, paste_dominance,
            copy_count, paste_volume, edit_bursts, avg_mouse_speed,
            mouse_speed_var_norm, scroll_events, session_duration,
            events_per_sec, typing_naturalness, mouse_naturalness, total_keystrokes
        ])
    return np.array(sessions)


def generate_bot_session(n=1) -> np.ndarray:
    """
    Simulate behavioral features of an AI/bot-assisted fraudulent user.
    Characteristics: very uniform timing, no backspaces, bulk paste, rapid input.
    """
    sessions = []
    for _ in range(n):
        avg_iki = np.random.normal(45, 10)            # Very fast
        iki_var = np.random.normal(200, 80)            # Very low variance
        iki_std = np.sqrt(max(iki_var, 0))
        iki_cv = iki_std / max(avg_iki, 1)
        iki_skewness = np.random.normal(0.1, 0.1)
        backspace_rate = np.abs(np.random.normal(0.005, 0.003))  # Almost no backspaces
        burst_ratio = np.abs(np.random.normal(0.7, 0.15))
        paste_count = max(1, int(np.random.poisson(4)))
        paste_dominance = np.random.uniform(0.6, 0.99)
        copy_count = int(np.random.poisson(2))
        paste_volume = paste_count * np.random.randint(50, 300)
        edit_bursts = max(0, int(np.random.normal(0.5, 0.5)))
        avg_mouse_speed = np.random.normal(400, 100)   # Unnaturally fast
        mouse_speed_var_norm = np.random.uniform(0.0, 0.15)  # Very uniform
        scroll_events = int(np.random.poisson(1))
        session_duration = np.random.normal(15, 8)     # Very fast completion
        events_per_sec = np.random.normal(15, 5)
        typing_naturalness = np.random.uniform(0.05, 0.3)
        mouse_naturalness = np.random.uniform(0.0, 0.2)
        total_keystrokes = max(10, int(np.random.normal(80, 30)))

        sessions.append([
            avg_iki, iki_var, iki_std, iki_cv, iki_skewness,
            backspace_rate, burst_ratio, paste_count, paste_dominance,
            copy_count, paste_volume, edit_bursts, avg_mouse_speed,
            mouse_speed_var_norm, scroll_events, session_duration,
            events_per_sec, typing_naturalness, mouse_naturalness, total_keystrokes
        ])
    return np.array(sessions)


# ─────────────────────────────────────────────────────────────
# 2. ISOLATION FOREST TRAINING (Unsupervised)
# ─────────────────────────────────────────────────────────────

def train_isolation_forest():
    from sklearn.ensemble import IsolationForest
    from sklearn.preprocessing import StandardScaler
    from sklearn.metrics import classification_report
    import warnings
    warnings.filterwarnings('ignore')

    logger.info("Generating synthetic training data...")
    n_human = 2000
    n_bot = 500  # Minority class for contamination estimation

    X_human = generate_human_session(n_human)
    X_bot = generate_bot_session(n_bot)

    # Isolation Forest is trained ONLY on human data (one-class)
    X_train = X_human

    # Validation set with labels
    X_val = np.vstack([generate_human_session(300), generate_bot_session(100)])
    y_val = np.array([1] * 300 + [-1] * 100)

    logger.info("Fitting StandardScaler...")
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)

    logger.info("Training Isolation Forest...")
    model = IsolationForest(
        n_estimators=200,
        contamination=0.05,  # Expected fraud rate
        max_features=0.8,
        random_state=42,
        n_jobs=-1
    )
    model.fit(X_train_scaled)

    # Evaluate
    y_pred = model.predict(X_val_scaled)  # 1=normal, -1=anomaly
    logger.info("Validation Results:")
    print(classification_report(y_val, y_pred, target_names=["anomaly (-1)", "normal (1)"]))

    # Save models
    iso_path = os.path.join(OUTPUT_DIR, "isolation_forest.joblib")
    scaler_path = os.path.join(OUTPUT_DIR, "scaler.joblib")
    joblib.dump(model, iso_path)
    joblib.dump(scaler, scaler_path)
    logger.info(f"Isolation Forest saved to {iso_path}")
    logger.info(f"Scaler saved to {scaler_path}")

    # Save feature names for documentation
    feature_names = [
        'avg_iki', 'iki_variance', 'iki_std', 'iki_cv', 'iki_skewness',
        'backspace_rate', 'burst_typing_ratio', 'paste_count', 'paste_dominance',
        'copy_count', 'paste_volume', 'edit_bursts', 'avg_mouse_speed',
        'mouse_speed_variance_norm', 'scroll_events', 'session_duration_s',
        'events_per_second', 'typing_naturalness', 'mouse_naturalness', 'total_keystrokes'
    ]
    with open(os.path.join(OUTPUT_DIR, "feature_names.json"), 'w') as f:
        json.dump(feature_names, f)

    return model, scaler


# ─────────────────────────────────────────────────────────────
# 3. LSTM SEQUENCE CLASSIFIER (Supervised)
# ─────────────────────────────────────────────────────────────

def generate_iki_sequences(n_human=500, n_bot=500, seq_len=50):
    """Generate IKI time series for LSTM training."""
    X, y = [], []

    for _ in range(n_human):
        # Human: variable IKIs with occasional long pauses (thinking)
        base_ikis = np.abs(np.random.normal(280, 120, seq_len))
        pauses = np.random.choice(seq_len, size=int(seq_len * 0.1), replace=False)
        base_ikis[pauses] *= np.random.uniform(3, 10, size=len(pauses))
        X.append(base_ikis)
        y.append(1)

    for _ in range(n_bot):
        # Bot: uniform IKIs, no pauses, possible zero-variance segments
        base = np.random.uniform(30, 80)
        base_ikis = base + np.random.normal(0, 5, seq_len)
        base_ikis = np.abs(base_ikis)
        X.append(base_ikis)
        y.append(0)

    X = np.array(X).reshape(-1, seq_len, 1).astype(np.float32)
    y = np.array(y).astype(np.float32)
    return X, y


def train_lstm():
    try:
        import torch
        import torch.nn as nn
        from torch.utils.data import DataLoader, TensorDataset
        logger.info("PyTorch available. Training LSTM...")
    except ImportError:
        logger.warning("PyTorch not installed. Skipping LSTM training.")
        logger.info("Install with: pip install torch")
        return

    SEQ_LEN = 50
    HIDDEN = 64
    EPOCHS = 20
    BATCH = 64
    LR = 1e-3
    DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

    class BehaviorLSTM(nn.Module):
        def __init__(self):
            super().__init__()
            self.lstm = nn.LSTM(1, HIDDEN, num_layers=2, batch_first=True, dropout=0.3)
            self.classifier = nn.Sequential(
                nn.Linear(HIDDEN, 32),
                nn.ReLU(),
                nn.Dropout(0.2),
                nn.Linear(32, 1),
                nn.Sigmoid()
            )

        def forward(self, x):
            _, (hn, _) = self.lstm(x)
            return self.classifier(hn[-1]).squeeze()

    X, y = generate_iki_sequences(1000, 1000, SEQ_LEN)
    split = int(0.8 * len(X))
    Xt, Xv = torch.tensor(X[:split]), torch.tensor(X[split:])
    yt, yv = torch.tensor(y[:split]), torch.tensor(y[split:])

    train_loader = DataLoader(TensorDataset(Xt, yt), batch_size=BATCH, shuffle=True)
    val_loader = DataLoader(TensorDataset(Xv, yv), batch_size=BATCH)

    model = BehaviorLSTM().to(DEVICE)
    optimizer = torch.optim.Adam(model.parameters(), lr=LR)
    criterion = nn.BCELoss()

    best_val = float('inf')
    for epoch in range(EPOCHS):
        model.train()
        train_loss = 0
        for xb, yb in train_loader:
            xb, yb = xb.to(DEVICE), yb.to(DEVICE)
            optimizer.zero_grad()
            pred = model(xb)
            loss = criterion(pred, yb)
            loss.backward()
            optimizer.step()
            train_loss += loss.item()

        model.eval()
        val_loss, correct, total = 0, 0, 0
        with torch.no_grad():
            for xb, yb in val_loader:
                xb, yb = xb.to(DEVICE), yb.to(DEVICE)
                pred = model(xb)
                val_loss += criterion(pred, yb).item()
                correct += ((pred > 0.5) == yb).sum().item()
                total += yb.size(0)

        acc = correct / total
        logger.info(f"Epoch {epoch+1:2d}/{EPOCHS} | train_loss={train_loss/len(train_loader):.4f} | val_loss={val_loss/len(val_loader):.4f} | val_acc={acc:.4f}")

        if val_loss < best_val:
            best_val = val_loss
            torch.save(model.state_dict(), os.path.join(OUTPUT_DIR, "lstm_behavior.pt"))

    logger.info(f"LSTM saved to {OUTPUT_DIR}/lstm_behavior.pt")


# ─────────────────────────────────────────────────────────────
# 4. MAIN
# ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--mode", choices=["unsupervised", "supervised", "all"], default="all")
    args = parser.parse_args()

    logger.info(f"Training mode: {args.mode}")

    if args.mode in ("unsupervised", "all"):
        train_isolation_forest()

    if args.mode in ("supervised", "all"):
        train_lstm()

    logger.info("Training complete!")
