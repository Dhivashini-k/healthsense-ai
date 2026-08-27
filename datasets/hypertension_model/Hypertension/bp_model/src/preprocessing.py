"""
Biomedical Signal Preprocessing Pipeline for PPG & ECG.
Implements Butterworth bandpass filtering, baseline wander removal, z-score normalization,
10-second sliding window segmentation, and signal quality / SNR artifact filtering.
"""

import numpy as np
from scipy.signal import butter, filtfilt, find_peaks
from typing import Tuple, List, Dict, Any, Optional, Union

try:
    from src.config import (
        SAMPLING_RATE, WINDOW_SIZE, WINDOW_STEP,
        PPG_LOWCUT, PPG_HIGHCUT, ECG_LOWCUT, ECG_HIGHCUT,
        MIN_SBP_PHYSIOLOGICAL, MAX_SBP_PHYSIOLOGICAL,
        MIN_DBP_PHYSIOLOGICAL, MAX_DBP_PHYSIOLOGICAL,
        MIN_PULSE_PRESSURE
    )
    from src.utils import logger
except ImportError:
    from .config import (
        SAMPLING_RATE, WINDOW_SIZE, WINDOW_STEP,
        PPG_LOWCUT, PPG_HIGHCUT, ECG_LOWCUT, ECG_HIGHCUT,
        MIN_SBP_PHYSIOLOGICAL, MAX_SBP_PHYSIOLOGICAL,
        MIN_DBP_PHYSIOLOGICAL, MAX_DBP_PHYSIOLOGICAL,
        MIN_PULSE_PRESSURE
    )
    from .utils import logger

def butter_bandpass(lowcut: float, highcut: float, fs: float, order: int = 4) -> Tuple[np.ndarray, np.ndarray]:
    """Designs Butterworth bandpass filter coefficients (b, a)."""
    nyq = 0.5 * fs
    low = lowcut / nyq
    high = highcut / nyq
    b, a = butter(order, [low, high], btype='band')
    return b, a

def filter_ppg(signal: np.ndarray, fs: float = SAMPLING_RATE) -> np.ndarray:
    """
    Applies zero-phase 4th order Butterworth bandpass filter (0.5 - 8.0 Hz) to PPG signal.
    Removes baseline wander (<0.5 Hz) and high-frequency muscular/motion noise (>8.0 Hz).
    """
    if len(signal) < 30:
        return signal
    b, a = butter_bandpass(PPG_LOWCUT, PPG_HIGHCUT, fs, order=4)
    filtered = filtfilt(b, a, signal)
    return filtered

def filter_ecg(signal: np.ndarray, fs: float = SAMPLING_RATE) -> np.ndarray:
    """
    Applies zero-phase 4th order Butterworth bandpass filter (0.5 - 40.0 Hz) to ECG signal.
    """
    if len(signal) < 30:
        return signal
    b, a = butter_bandpass(ECG_LOWCUT, ECG_HIGHCUT, fs, order=4)
    filtered = filtfilt(b, a, signal)
    return filtered

def normalize_signal(signal: np.ndarray) -> np.ndarray:
    """
    Z-score normalizes signal (zero mean, unit variance).
    Handles flat signals safely.
    """
    std = np.std(signal)
    if std < 1e-8:
        return np.zeros_like(signal)
    return (signal - np.mean(signal)) / std

def calculate_signal_quality(signal: np.ndarray) -> float:
    """
    Calculates Signal-to-Noise Ratio (SNR) or regularity metric for PPG window.
    Returns value >= 0. Higher is cleaner.
    """
    if len(signal) == 0:
        return 0.0
    std = np.std(signal)
    if std < 1e-6:
        return 0.0  # Flatline artifact
    
    # Peak detection power
    peaks, _ = find_peaks(signal, distance=int(SAMPLING_RATE * 0.4))
    if len(peaks) < 3:
        return 0.1  # Too few peaks for a 10s window
        
    peak_amps = signal[peaks]
    snr = np.mean(peak_amps) / (np.std(peak_amps) + 1e-6)
    return float(snr)

def is_window_valid(
    ppg_win: np.ndarray, 
    abp_win: Optional[np.ndarray] = None,
    sbp: Optional[float] = None, 
    dbp: Optional[float] = None
) -> bool:
    """
    Checks whether a 10-second signal window is valid and physiologically sound.
    Rejects NaN values, zero flatlines, severe artifacts, and non-physiological SBP/DBP targets.
    """
    if np.isnan(ppg_win).any() or np.isinf(ppg_win).any():
        return False
    if np.std(ppg_win) < 1e-5:
        return False  # Zero flatline
        
    if sbp is not None and dbp is not None:
        if sbp < MIN_SBP_PHYSIOLOGICAL or sbp > MAX_SBP_PHYSIOLOGICAL:
            return False
        if dbp < MIN_DBP_PHYSIOLOGICAL or dbp > MAX_DBP_PHYSIOLOGICAL:
            return False
        if (sbp - dbp) < MIN_PULSE_PRESSURE:
            return False

    return True

def preprocess_raw_signal(
    ppg: np.ndarray, 
    ecg: Optional[np.ndarray] = None,
    fs: float = SAMPLING_RATE
) -> Tuple[np.ndarray, Optional[np.ndarray]]:
    """
    Full preprocessing pipeline for raw input signals:
    1. Butterworth Bandpass Filtering.
    2. Z-Score Normalization.
    """
    ppg_clean = filter_ppg(ppg, fs=fs)
    ppg_norm = normalize_signal(ppg_clean)
    
    ecg_norm = None
    if ecg is not None and len(ecg) == len(ppg):
        ecg_clean = filter_ecg(ecg, fs=fs)
        ecg_norm = normalize_signal(ecg_clean)
        
    return ppg_norm, ecg_norm
