"""
GPU configuration utility - detects and configures device for PyTorch models

This module chooses a valid CUDA device index (based on available CUDA devices).
On systems with hybrid graphics (integrated + NVIDIA), Task Manager may list GPUs
with different indexes than CUDA. PyTorch only exposes NVIDIA CUDA devices and
numbers them starting at 0. This file therefore selects a valid CUDA index and
supports selecting a preferred index if multiple CUDA devices are present.
"""

import os
import torch
# torch.cuda prints removed from module level


def _preferred_cuda_index():
    """Return preferred CUDA index based on availability and environment.

    Priority:
    - If environment variable `CUDA_DEVICE` is set to an integer, use that (clamped).
    - Otherwise, if more than one CUDA device exists, prefer index 1 (if available).
    - Otherwise use index 0.
    """
    count = torch.cuda.device_count()
    if count == 0:
        return None

    # allow explicit override
    env = os.environ.get("CUDA_DEVICE")
    if env is not None:
        try:
            idx = int(env)
        except Exception:
            idx = 0
        # clamp to available range
        if idx < 0:
            idx = 0
        if idx >= count:
            idx = count - 1
        return idx

    # default preference: use device 1 if there are multiple CUDA devices,
    # otherwise use device 0
    return 1 if count > 1 else 0


def get_device():
    """
    Detect and return the best available device (CUDA > MPS > CPU).

    This chooses a valid `cuda:<index>` that exists in PyTorch. On hybrid GPU
    systems the NVIDIA card(s) exposed to CUDA will be indexed starting at 0.
    If you need to select a specific physical GPU shown in Windows Task Manager,
    set the environment variable `CUDA_VISIBLE_DEVICES` before starting Python
    (see instructions in README or the helper below).
    """
    if torch.cuda.is_available():
        idx = _preferred_cuda_index()
        if idx is None:
            # defensive fallback
            device = torch.device("cpu")
            print("⚠ CUDA available but no device selected, using CPU")
            return device

        device = torch.device(f"cuda:{idx}")
        try:
            name = torch.cuda.get_device_name(idx)
        except Exception:
            name = f"cuda:{idx}"
        print(f"✓ CUDA available (count={torch.cuda.device_count()}), using cuda:{idx} -> {name}")
        return device
    else:
        device = torch.device("cpu")
        print("⚠ GPU not available, using CPU")
        return device


def get_device_id():
    """
    Returns an integer device id suitable for HuggingFace `pipeline(..., device=...)`.

    - Returns the CUDA index (0-based) when CUDA is available.
    - Returns 0 when using MPS.
    - Returns -1 for CPU.
    """
    if torch.cuda.is_available():
        idx = _preferred_cuda_index()
        return idx if idx is not None else -1
    if torch.backends.mps.is_available():
        return 0
    return -1


def print_gpu_info():
    """Print CUDA device(s) information"""
    if torch.cuda.is_available():
        count = torch.cuda.device_count()
        print(f"CUDA device count: {count}")
        for i in range(count):
            try:
                props = torch.cuda.get_device_properties(i)
                print(f"  cuda:{i} -> {props.name} | VRAM: {props.total_memory / 1024**3:.2f} GB")
            except Exception:
                print(f"  cuda:{i} -> <unavailable>")
    else:
        print("GPU not available")


def usage_note():
    """Return a short note explaining how to force a physical GPU selection.

    Example (PowerShell):
      $env:CUDA_VISIBLE_DEVICES = "1"
      python script.py

    This remaps the listed physical device(s) to the CUDA-visible indices (0,1,...)
    that PyTorch sees. For example, setting `CUDA_VISIBLE_DEVICES=1` will make the
    system's physical GPU 1 appear as `cuda:0` to PyTorch.
    """
    return (
        "To force a specific physical GPU (Windows PowerShell):\n"
        "  $env:CUDA_VISIBLE_DEVICES = \"1\"\n"
        "  python -m streamlit run app.py\n\n"
        "Setting `CUDA_VISIBLE_DEVICES` remaps physical device indexes to PyTorch's\n"
        "cuda:<index> numbering (so physical GPU 1 becomes cuda:0)."
    )
# Module execution prints removed