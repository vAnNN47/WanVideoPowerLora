"""
WanVideo Power LoRA Loader - A dynamic LoRA loader with toggle on/off functionality
Inspired by rgthree's Power Lora Loader
"""

import os
import logging

# Set up logging
log = logging.getLogger("WanVideoPowerLoraLoader")

# Import ComfyUI modules
try:
    import folder_paths
except ImportError:
    folder_paths = None
    log.warning("folder_paths not available - running outside ComfyUI?")

NODE_NAME = "WanVideo Power Lora Loader"


class FlexibleOptionalInputType(dict):
    """
    A special class that allows flexible optional inputs.
    This enables dynamic number of LoRA inputs from the frontend.
    """
    def __init__(self, type, data=None):
        self.type = type
        if data:
            super().__init__(data)
    
    def __contains__(self, key):
        return True
    
    def __getitem__(self, key):
        return (self.type, {"forceInput": True})


# Define any_type for flexible inputs
class AnyType(str):
    """A special type that matches any other type."""
    def __ne__(self, other):
        return False

any_type = AnyType("*")


def get_lora_by_filename(file_path, log_node=None):
    """Returns a lora by filename, looking for exact paths and then fuzzier matching."""
    if folder_paths is None:
        return file_path
    
    lora_paths = folder_paths.get_filename_list('loras')
    
    if file_path in lora_paths:
        return file_path
    
    lora_paths_no_ext = [os.path.splitext(x)[0] for x in lora_paths]
    
    # See if we've entered the exact path, but without the extension
    if file_path in lora_paths_no_ext:
        found = lora_paths[lora_paths_no_ext.index(file_path)]
        return found
    
    file_path_force_no_ext = os.path.splitext(file_path)[0]
    if file_path_force_no_ext in lora_paths_no_ext:
        found = lora_paths[lora_paths_no_ext.index(file_path_force_no_ext)]
        return found
    
    # See if we passed just the name, without paths.
    lora_filenames_only = [os.path.basename(x) for x in lora_paths]
    if file_path in lora_filenames_only:
        found = lora_paths[lora_filenames_only.index(file_path)]
        if log_node is not None:
            log.info(f'[{log_node}] Found lora by filename: {found}')
        return found
    
    file_path_force_filename = os.path.basename(file_path)
    if file_path_force_filename in lora_filenames_only:
        found = lora_paths[lora_filenames_only.index(file_path_force_filename)]
        if log_node is not None:
            log.info(f'[{log_node}] Found lora by filename: {found}')
        return found
    
    # Check the filenames and without extension.
    lora_filenames_and_no_ext = [os.path.splitext(os.path.basename(x))[0] for x in lora_paths]
    if file_path in lora_filenames_and_no_ext:
        found = lora_paths[lora_filenames_and_no_ext.index(file_path)]
        if log_node is not None:
            log.info(f'[{log_node}] Found lora by filename without ext: {found}')
        return found
    
    file_path_force_filename_and_no_ext = os.path.splitext(os.path.basename(file_path))[0]
    if file_path_force_filename_and_no_ext in lora_filenames_and_no_ext:
        found = lora_paths[lora_filenames_and_no_ext.index(file_path_force_filename_and_no_ext)]
        if log_node is not None:
            log.info(f'[{log_node}] Found lora by filename without ext: {found}')
        return found
    
    # Finally, super fuzzy, we'll just check if the input exists in the path at all.
    for index, lora_path in enumerate(lora_paths):
        if file_path in lora_path:
            found = lora_paths[index]
            if log_node is not None:
                log.info(f'[{log_node}] Found lora by fuzzy match: {found}')
            return found
    
    if log_node is not None:
        log.warning(f'[{log_node}] Could not find lora: {file_path}')
    return None


class WanVideoPowerLoraLoader:
    """
    A powerful, flexible node to add multiple LoRAs to WanVideo models with toggle on/off functionality.
    """
    
    NAME = NODE_NAME
    CATEGORY = "WanVideoWrapper"
    
    @classmethod
    def INPUT_TYPES(cls):
        return {
            "required": {},
            # Since we will pass any number of loras in from the UI, this needs to always allow any input
            "optional": FlexibleOptionalInputType(type=any_type, data={
                "prev_lora": ("WANVIDLORA",),
            }),
            "hidden": {},
        }
    
    RETURN_TYPES = ("WANVIDLORA",)
    RETURN_NAMES = ("lora",)
    FUNCTION = "load_loras"
    DESCRIPTION = "A powerful LoRA loader with toggle on/off functionality for each LoRA. Right-click on a LoRA widget for options to move, toggle, or delete."
    
    def load_loras(self, prev_lora=None, **kwargs):
        """Loops over the provided loras in kwargs and builds a list of valid enabled ones."""
        loras_list = []
        
        # Start with previous loras if provided
        if prev_lora is not None:
            loras_list.extend(prev_lora)
        
        # Process each lora from kwargs
        for key, value in kwargs.items():
            key_upper = key.upper()
            
            # Check if this is a lora input with the expected structure
            if key_upper.startswith('LORA_') and isinstance(value, dict):
                if 'on' in value and 'lora' in value and 'strength' in value:
                    # Skip if disabled or no lora selected
                    if not value['on']:
                        log.info(f'[{NODE_NAME}] Skipping disabled LoRA: {value.get("lora", "Unknown")}')
                        continue
                    
                    if not value['lora'] or value['lora'] == 'None':
                        continue
                    
                    strength = value['strength']
                    if strength == 0:
                        log.info(f'[{NODE_NAME}] Skipping LoRA with zero strength: {value["lora"]}')
                        continue
                    
                    # Find the lora file
                    lora_file = get_lora_by_filename(value['lora'], log_node=NODE_NAME)
                    if lora_file is None:
                        log.warning(f'[{NODE_NAME}] Could not find LoRA file: {value["lora"]}')
                        continue
                    
                    try:
                        if folder_paths is not None:
                            lora_path = folder_paths.get_full_path_or_raise("loras", lora_file)
                        else:
                            lora_path = lora_file
                    except:
                        lora_path = lora_file
                    
                    # Build lora dict compatible with WanVideoWrapper
                    lora_entry = {
                        "path": lora_path,
                        "strength": round(strength, 4),
                        "name": os.path.splitext(os.path.basename(lora_file))[0],
                        "blocks": {},  # Default empty blocks
                        "layer_filter": "",
                        "low_mem_load": value.get('low_mem_load', False),
                        "merge_loras": value.get('merge_loras', True),
                    }
                    
                    loras_list.append(lora_entry)
                    log.info(f'[{NODE_NAME}] Added LoRA: {lora_entry["name"]} with strength: {lora_entry["strength"]}')
        
        if len(loras_list) == 0:
            return (None,)
        
        return (loras_list,)
    
    @classmethod
    def get_enabled_loras_from_prompt_node(cls, prompt_node):
        """Gets enabled loras of a node within a server prompt."""
        result = []
        for name, lora in prompt_node.get('inputs', {}).items():
            if name.startswith('lora_') and isinstance(lora, dict) and lora.get('on'):
                lora_file = get_lora_by_filename(lora['lora'], log_node=cls.NAME)
                if lora_file is not None:
                    try:
                        if folder_paths is not None:
                            lora_path = folder_paths.get_full_path_or_raise("loras", lora_file)
                        else:
                            lora_path = lora_file
                    except:
                        lora_path = lora_file
                    lora_dict = {
                        'name': lora['lora'],
                        'strength': lora['strength'],
                        'path': lora_path
                    }
                    result.append(lora_dict)
        return result


# Node registration
NODE_CLASS_MAPPINGS = {
    "WanVideoPowerLoraLoader": WanVideoPowerLoraLoader,
}

NODE_DISPLAY_NAME_MAPPINGS = {
    "WanVideoPowerLoraLoader": "WanVideo Power Lora Loader",
}
