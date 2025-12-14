"""
WanVideo Power LoRA Loader - Custom Node for ComfyUI
A dynamic LoRA loader with toggle on/off functionality for WanVideoWrapper
"""

from .wanvideo_power_lora_loader import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS

# Web directory for JavaScript extensions
WEB_DIRECTORY = "./web/js"

__all__ = ["NODE_CLASS_MAPPINGS", "NODE_DISPLAY_NAME_MAPPINGS", "WEB_DIRECTORY"]
