"""
Biomedical Feature Engineering Module for PPG & ECG Signals.
Extracts handcrafted Time-Domain, Morphological, HRV / PAT Timing,
and Frequency-Domain features for Blood Pressure Estimation.
"""

import numpy as np
from scipy.signal import find_peaks, welch
from scipy.stats import skew, kurtosis
from typing import Dict, Any, List, Optional, Tuple

try:
    from src.config import SAMPLING_RATE
    from src.utils import logger
except ImportError:
    from .config import SAMPLING_RATE
    from .utils import logger

def extract_time_domain_features(ppg_win: np.ndarray) -> Dict[str, float]:
    """Extracts statistical time-domain features from PPG window."""
    mean_val = float(np.mean(ppg_win))
    std_val = float(np.std(ppg_win))
    var_val = float(np.var(ppg_win))
    skew_val = float(skew(ppg_win)) if std_val > 1e-6 else 0.0
    kurt_val = float(kurtosis(ppg_win)) if std_val > 1e-6 else 0.0
    p2p_val = float(np.ptp(ppg_win))
    
    # Zero-crossing rate
    zero_crossings = np.where(np.diff(np.signbit(ppg_win)))[0]
    zcr_val = float(len(zero_crossings) / len(ppg_win))

    return {
        "ppg_mean": mean_val,
        "ppg_std": std_val,
        "ppg_var": var_val,
        "ppg_skew": skew_val,
        "ppg_kurt": kurt_val,
        "ppg_p2p": p2p_val,
        "ppg_zcr": zcr_val
    }

def extract_morphological_features(ppg_win: np.ndarray, fs: float = SAMPLING_RATE) -> Dict[str, float]:
    """
    Extracts PPG pulse waveform morphological features:
    - Systolic time (T_s), Diastolic time (T_d)
    - Pulse width at 50% peak amplitude
    - Augmentation Index (AIP), Perfusion Index
    - Area Under Systolic Curve (AUC_sys), Diastolic Curve (AUC_dia)
    """
    peaks, _ = find_peaks(ppg_win, distance=int(fs * 0.4), height=0.1)
    troughs, _ = find_peaks(-ppg_win, distance=int(fs * 0.4))
    
    if len(peaks) < 2 or len(troughs) < 2:
        return {
            "systolic_time": 0.25,
            "diastolic_time": 0.50,
            "pulse_width_50": 0.30,
            "augmentation_index": 0.0,
            "perfusion_index": 1.0,
            "auc_sys": 0.5,
            "auc_dia": 0.5,
            "sys_dia_ratio": 1.0
        }

    # Average pulse duration features
    pulse_durations = np.diff(peaks) / fs
    mean_pulse_dur = float(np.mean(pulse_durations)) if len(pulse_durations) > 0 else 0.8
    
    # Peak amplitude & crest time
    crest_times = []
    for p in peaks:
        prev_troughs = troughs[troughs < p]
        if len(prev_troughs) > 0:
            crest_times.append((p - prev_troughs[-1]) / fs)
            
    mean_crest_time = float(np.mean(crest_times)) if len(crest_times) > 0 else 0.25
    diastolic_time = max(0.05, mean_pulse_dur - mean_crest_time)
    
    # Pulse width at 50%
    pulse_widths = []
    for p in peaks:
        half_amp = ppg_win[p] * 0.5
        left_idx = p
        while left_idx > 0 and ppg_win[left_idx] > half_amp:
            left_idx -= 1
        right_idx = p
        while right_idx < len(ppg_win) - 1 and ppg_win[right_idx] > half_amp:
            right_idx += 1
        pulse_widths.append((right_idx - left_idx) / fs)
        
    mean_pw_50 = float(np.mean(pulse_widths)) if len(pulse_widths) > 0 else 0.30

    # Area split
    total_auc = float(np.sum(np.abs(ppg_win)))
    auc_sys = float(np.sum(np.abs(ppg_win[:int(len(ppg_win) * 0.4)])))
    auc_dia = max(0.01, total_auc - auc_sys)

    return {
        "systolic_time": mean_crest_time,
        "diastolic_time": diastolic_time,
        "pulse_width_50": mean_pw_50,
        "augmentation_index": float((mean_crest_time / (diastolic_time + 1e-6))),
        "perfusion_index": float(np.ptp(ppg_win) / (np.mean(ppg_win) + 1e-6)),
        "auc_sys": auc_sys,
        "auc_dia": auc_dia,
        "sys_dia_ratio": float(auc_sys / (auc_dia + 1e-6))
    }

def extract_hrv_and_pat_features(
    ppg_win: np.ndarray, 
    ecg_win: Optional[np.ndarray] = None, 
    fs: float = SAMPLING_RATE
) -> Dict[str, float]:
    """
    Extracts Heart Rate (BPM), Heart Rate Variability (SDNN, RMSSD, pNN50),
    and Pulse Arrival Time (PAT) / Transit Time between ECG R-peaks and PPG systolic peaks.
    """
    ppg_peaks, _ = find_peaks(ppg_win, distance=int(fs * 0.4), height=0.1)
    
    if len(ppg_peaks) >= 2:
        pp_intervals = np.diff(ppg_peaks) / fs * 1000.0  # in ms
        heart_rate = float(60.0 / (np.mean(pp_intervals) / 1000.0))
        sdnn = float(np.std(pp_intervals))
        rmssd = float(np.sqrt(np.mean(np.square(np.diff(pp_intervals))))) if len(pp_intervals) > 1 else 0.0
        pnn50 = float(np.sum(np.abs(np.diff(pp_intervals)) > 50.0) / (len(pp_intervals) - 1)) if len(pp_intervals) > 1 else 0.0
    else:
        heart_rate = 72.0
        sdnn = 30.0
        rmssd = 25.0
        pnn50 = 0.05

    # Pulse Arrival Time (PAT) calculation if ECG is available
    pat_mean = 250.0  # default ms
    pat_std = 15.0
    
    if ecg_win is not None and len(ecg_win) == len(ppg_win):
        ecg_peaks, _ = find_peaks(ecg_win, distance=int(fs * 0.4), height=0.3)
        if len(ecg_peaks) >= 2 and len(ppg_peaks) >= 2:
            pats = []
            for r_pk in ecg_peaks:
                # Find next PPG peak
                future_ppg = ppg_peaks[ppg_peaks > r_pk]
                if len(future_ppg) > 0:
                    delay_ms = (future_ppg[0] - r_pk) / fs * 1000.0
                    if 100.0 <= delay_ms <= 500.0:  # Physiological PAT delay range
                        pats.append(delay_ms)
            if len(pats) > 0:
                pat_mean = float(np.mean(pats))
                pat_std = float(np.std(pats))

    return {
        "heart_rate_bpm": heart_rate,
        "hrv_sdnn": sdnn,
        "hrv_rmssd": rmssd,
        "hrv_pnn50": pnn50,
        "pat_mean_ms": pat_mean,
        "pat_std_ms": pat_std
    }

def extract_frequency_domain_features(ppg_win: np.ndarray, fs: float = SAMPLING_RATE) -> Dict[str, float]:
    """
    Extracts Spectral Power in Low Frequency (LF: 0.04-0.15 Hz), High Frequency (HF: 0.15-0.4 Hz),
    LF/HF ratio, and Spectral Entropy.
    """
    freqs, psd = welch(ppg_win, fs=fs, nperseg=min(len(ppg_win), 256))
    
    lf_mask = (freqs >= 0.04) & (freqs < 0.15)
    hf_mask = (freqs >= 0.15) & (freqs < 0.40)
    
    lf_power = float(np.trapz(psd[lf_mask], freqs[lf_mask])) if np.any(lf_mask) else 1e-4
    hf_power = float(np.trapz(psd[hf_mask], freqs[hf_mask])) if np.any(hf_mask) else 1e-4
    
    lf_hf_ratio = float(lf_power / (hf_power + 1e-6))
    
    # Spectral Entropy
    psd_norm = psd / (np.sum(psd) + 1e-8)
    psd_norm = psd_norm[psd_norm > 0]
    spec_entropy = float(-np.sum(psd_norm * np.log2(psd_norm))) if len(psd_norm) > 0 else 0.0

    return {
        "spec_lf_power": lf_power,
        "spec_hf_power": hf_power,
        "spec_lf_hf_ratio": lf_hf_ratio,
        "spec_entropy": spec_entropy
    }

def extract_all_window_features(
    ppg_win: np.ndarray, 
    ecg_win: Optional[np.ndarray] = None, 
    fs: float = SAMPLING_RATE
) -> Dict[str, float]:
    """
    Combines all Time-Domain, Morphological, HRV/PAT, and Frequency-Domain features into one feature dict.
    """
    f_time = extract_time_domain_features(ppg_win)
    f_morph = extract_morphological_features(ppg_win, fs=fs)
    f_hrv = extract_hrv_and_pat_features(ppg_win, ecg_win=ecg_win, fs=fs)
    f_freq = extract_frequency_domain_features(ppg_win, fs=fs)
    
    combined = {}
    combined.update(f_time)
    combined.update(f_morph)
    combined.update(f_hrv)
    combined.update(f_freq)
    
    return combined
