"""
Feature Extraction Service
Transforms raw behavioral event logs into ML-ready feature vectors.
"""
import numpy as np
from typing import List, Dict, Any
import math


def extract_features(events: List[Dict[str, Any]], session_duration: int) -> Dict[str, float]:
    """
    Extract behavioral biometric features from raw event stream.
    
    Returns:
        Feature dict ready for ML inference + human interpretation
    """
    keydowns = [e for e in events if e['type'] == 'keydown']
    keyups   = [e for e in events if e['type'] == 'keyup']
    paste_events = [e for e in events if e['type'] == 'paste']
    copy_events  = [e for e in events if e['type'] == 'copy']
    cut_events   = [e for e in events if e['type'] == 'cut']
    mouse_paths  = [e for e in events if e['type'] == 'mouse_path_segment']
    scroll_events = [e for e in events if e['type'] == 'scroll']
    input_events = [e for e in events if e['type'] == 'input']

    features = {}

    # === KEYSTROKE DYNAMICS ===
    features.update(_keystroke_features(keydowns))

    # === MOUSE DYNAMICS ===
    features.update(_mouse_features(mouse_paths))

    # === PASTE / COPY BEHAVIOR ===
    features['paste_count'] = len(paste_events)
    features['copy_count'] = len(copy_events)
    features['cut_count'] = len(cut_events)
    features['paste_volume'] = sum(e.get('length', 0) for e in paste_events)

    # === EDIT BURST DETECTION ===
    features['edit_bursts'] = _detect_edit_bursts(keydowns)

    # === SCROLL BEHAVIOR ===
    features['scroll_events'] = len(scroll_events)

    # === SESSION LEVEL ===
    features['session_duration_s'] = session_duration / 1000.0
    features['events_per_second'] = len(events) / max(session_duration / 1000.0, 1)
    features['total_keystrokes'] = len(keydowns)

    # === DERIVED FEATURES ===
    # Typing naturalness: combination of IKI variance and backspace rate
    iki_var = features.get('iki_variance', 0)
    iki_var_norm = min(iki_var / 50000, 1.0)  # normalize to 0-1
    backspace = features.get('backspace_rate', 0)
    features['typing_naturalness'] = float(
        0.6 * iki_var_norm + 0.4 * min(backspace * 3, 1.0)
    )

    # Mouse naturalness: based on speed variance and path complexity
    features['mouse_naturalness'] = features.get('mouse_speed_variance_norm', 0.5)

    # Paste dominance: high paste with low typing = suspicious
    total_input = features.get('total_keystrokes', 1) + features.get('paste_volume', 0)
    features['paste_dominance'] = features['paste_volume'] / max(total_input, 1)

    return features


def _keystroke_features(keydowns: List[Dict]) -> Dict[str, float]:
    if len(keydowns) < 2:
        return {
            'avg_iki': 0, 'iki_variance': 0, 'iki_std': 0, 'iki_cv': 0,
            'backspace_rate': 0, 'enter_rate': 0, 'min_iki': 0, 'max_iki': 0,
            'iki_skewness': 0, 'burst_typing_ratio': 0
        }

    ikis = [e['iki'] for e in keydowns if e.get('iki') is not None]
    if not ikis:
        return {'avg_iki': 0, 'iki_variance': 0, 'iki_std': 0, 'iki_cv': 0,
                'backspace_rate': 0, 'enter_rate': 0, 'min_iki': 0, 'max_iki': 0,
                'iki_skewness': 0, 'burst_typing_ratio': 0}

    ikis_arr = np.array(ikis)
    total = len(keydowns)

    # Filter outliers (> 5s gaps = thinking pause, not typing)
    typing_ikis = ikis_arr[ikis_arr < 5000]

    avg = float(np.mean(typing_ikis)) if len(typing_ikis) > 0 else 0
    var = float(np.var(typing_ikis)) if len(typing_ikis) > 1 else 0
    std = float(np.std(typing_ikis)) if len(typing_ikis) > 1 else 0
    cv = std / avg if avg > 0 else 0  # coefficient of variation

    # Skewness (manual calculation for compatibility)
    if len(typing_ikis) > 2 and std > 0:
        skewness = float(np.mean(((typing_ikis - avg) / std) ** 3))
    else:
        skewness = 0

    backspace_keys = [e for e in keydowns if e.get('key') == 'Backspace']
    enter_keys = [e for e in keydowns if e.get('key') == 'Enter']

    # Burst typing: fraction of IKIs < 80ms (very fast, often bot-like)
    burst_count = int(np.sum(typing_ikis < 80)) if len(typing_ikis) > 0 else 0

    return {
        'avg_iki': avg,
        'iki_variance': var,
        'iki_std': std,
        'iki_cv': cv,
        'min_iki': float(np.min(typing_ikis)) if len(typing_ikis) > 0 else 0,
        'max_iki': float(np.max(typing_ikis)) if len(typing_ikis) > 0 else 0,
        'iki_skewness': skewness,
        'backspace_rate': len(backspace_keys) / max(total, 1),
        'enter_rate': len(enter_keys) / max(total, 1),
        'burst_typing_ratio': burst_count / max(len(typing_ikis), 1),
    }


def _mouse_features(mouse_path_events: List[Dict]) -> Dict[str, float]:
    if not mouse_path_events:
        return {
            'mouse_path_count': 0, 'avg_mouse_speed': 0,
            'mouse_speed_variance': 0, 'mouse_speed_variance_norm': 0.3,
            'mouse_direction_changes': 0
        }

    speeds = []
    direction_changes = 0

    for event in mouse_path_events:
        path = event.get('path', [])
        for p in path:
            speeds.append(p.get('speed', 0))

    if len(speeds) < 2:
        return {
            'mouse_path_count': len(mouse_path_events),
            'avg_mouse_speed': 0, 'mouse_speed_variance': 0,
            'mouse_speed_variance_norm': 0.3, 'mouse_direction_changes': 0
        }

    speeds_arr = np.array(speeds)
    avg_speed = float(np.mean(speeds_arr))
    speed_var = float(np.var(speeds_arr))

    # Normalized: high variance = more human-like (0-1 scale)
    speed_var_norm = min(speed_var / 10000, 1.0)

    return {
        'mouse_path_count': len(mouse_path_events),
        'avg_mouse_speed': avg_speed,
        'mouse_speed_variance': speed_var,
        'mouse_speed_variance_norm': speed_var_norm,
        'mouse_direction_changes': direction_changes
    }


def _detect_edit_bursts(keydowns: List[Dict]) -> int:
    """
    Detect edit bursts: rapid sequences of backspace + typing.
    High edit bursts = more human-like cognitive correction behavior.
    """
    if len(keydowns) < 3:
        return 0

    bursts = 0
    i = 0
    while i < len(keydowns) - 2:
        if keydowns[i].get('key') == 'Backspace':
            j = i
            while j < len(keydowns) and keydowns[j].get('key') == 'Backspace':
                j += 1
            if j < len(keydowns) and keydowns[j].get('key') == 'CHAR':
                bursts += 1
            i = j
        else:
            i += 1
    return bursts


def features_to_vector(features: Dict[str, float]) -> List[float]:
    """Convert feature dict to ordered numpy array for ML model input."""
    feature_order = [
        'avg_iki', 'iki_variance', 'iki_std', 'iki_cv', 'iki_skewness',
        'backspace_rate', 'burst_typing_ratio', 'paste_count', 'paste_dominance',
        'copy_count', 'paste_volume', 'edit_bursts', 'avg_mouse_speed',
        'mouse_speed_variance_norm', 'scroll_events', 'session_duration_s',
        'events_per_second', 'typing_naturalness', 'mouse_naturalness', 'total_keystrokes'
    ]
    return [features.get(f, 0.0) for f in feature_order]
