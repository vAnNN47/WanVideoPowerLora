# WanVideo Power LoRA Loader

A dynamic LoRA loader with **toggle on/off functionality** for ComfyUI-WanVideoWrapper, inspired by rgthree's Power Lora Loader.

## Features

- ✅ **Toggle On/Off** - Enable/disable individual LoRAs with a single click
- ✅ **Toggle All** - Enable/disable all LoRAs at once
- ✅ **Dynamic LoRAs** - Add as many LoRAs as you need with the "➕ Add LoRA" button
- ✅ **Adjustable Strength** - Click +/- buttons or click the value to type directly
- ✅ **Delete/Move Up&Down LoRAs** - Delete or move individual LoRAs by right click
- ✅ **Compatible** - Addon to Kijai's WanVideoWrapper

## Installation

1. git clone this repo to `custom_nodes` directory:
   ```
   ComfyUI/custom_nodes/wanvideo-power-lora-loader/
   ```

2. Restart ComfyUI

## Usage

1. In ComfyUI, search for **"WanVideo Power Lora Loader"** in the node browser
2. Add the node to your workflow
3. Click **"➕ Add LoRA"** to add LoRAs
4. Click on the LoRA name area to select a LoRA from the list
5. Use the checkbox to toggle LoRAs on/off
6. Adjust strength with +/- buttons or click the value
7. Connect the `lora` output to your **WanVideo Model Loader** node's `lora` input

## Node Name in ComfyUI

**Display Name:** `WanVideo Power Lora Loader`

**Internal Name:** `WanVideoPowerLoraLoader`

**Category:** `WanVideoWrapper`

## Compatibility

- ✅ ComfyUI-WanVideoWrapper
- ✅ Can chain with `prev_lora` input from other LoRA selectors

## Future Development

- Support `merge_loras` and `low_mem_load` settings.


## License

MIT License

## Credits

- Inspired by [rgthree-comfy](https://github.com/rgthree/rgthree-comfy) Power Lora Loader
- Built for [ComfyUI-WanVideoWrapper](https://github.com/kijai/ComfyUI-WanVideoWrapper)
