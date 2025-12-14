/**
 * WanVideo Power LoRA Loader - rgthree style UI v3
 */

import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";

const NODE_TYPE = "WanVideoPowerLoraLoader";
let lorasListCache = [];

// Load loras list once
async function loadLorasList() {
    if (lorasListCache.length > 0) return lorasListCache;
    try {
        const resp = await api.fetchApi("/object_info");
        const info = await resp.json();
        if (info.WanVideoLoraSelect?.input?.required?.lora?.[0]) {
            lorasListCache = info.WanVideoLoraSelect.input.required.lora[0];
        } else if (info.LoraLoader?.input?.required?.lora_name?.[0]) {
            lorasListCache = info.LoraLoader.input.required.lora_name[0];
        }
    } catch (e) {
        console.error("Failed to load loras:", e);
    }
    return lorasListCache;
}

// Preload
loadLorasList();

app.registerExtension({
    name: "WanVideo.PowerLoraLoader",
    
    async beforeRegisterNodeDef(nodeType, nodeData) {
        if (nodeData.name !== NODE_TYPE) return;
        
        // Store loras data on the node
        nodeType.prototype.lorasData = [];
        
        const origOnNodeCreated = nodeType.prototype.onNodeCreated;
        nodeType.prototype.onNodeCreated = function() {
            origOnNodeCreated?.apply(this, arguments);
            
            // Initialize loras data
            this.lorasData = [];
            
            // Remove default widgets
            this.widgets = [];
            
            // Set minimum size
            this.size = [300, 80];
            this.setDirtyCanvas(true, true);
        };
        
        // Compute minimum size based on content
        nodeType.prototype.computeMinSize = function() {
            const rowHeight = 24;
            const baseHeight = 80;
            const minWidth = 300;
            
            let height = baseHeight;
            
            // Add header height if there are loras
            if (this.lorasData && this.lorasData.length > 0) {
                height += rowHeight; // header
                height += this.lorasData.length * rowHeight; // lora rows
            }
            
            return [minWidth, height];
        };
        
        // Override onResize to enforce minimum size
        const origOnResize = nodeType.prototype.onResize;
        nodeType.prototype.onResize = function(size) {
            const minSize = this.computeMinSize();
            
            // Enforce minimum width
            if (size[0] < minSize[0]) {
                size[0] = minSize[0];
            }
            
            // Enforce minimum height
            if (size[1] < minSize[1]) {
                size[1] = minSize[1];
            }
            
            // Update the node size
            this.size[0] = size[0];
            this.size[1] = size[1];
            
            return origOnResize?.apply(this, arguments);
        };
        
        // Custom drawing
        const origOnDrawForeground = nodeType.prototype.onDrawForeground;
        nodeType.prototype.onDrawForeground = function(ctx) {
            origOnDrawForeground?.apply(this, arguments);
            
            if (this.flags?.collapsed) return;
            
            const nodeWidth = this.size[0];
            let y = 30; // Start below title
            const rowHeight = 24;
            const margin = 12;
            const toggleWidth = 26;
            const toggleHeight = 14;
            const toggleRadius = toggleHeight / 2;
            const knobRadius = 5;
            
            // Draw header if there are loras
            if (this.lorasData && this.lorasData.length > 0) {
                const midY = y + rowHeight / 2;
                
                // Toggle All - pill shape
                const allOn = this.lorasData.every(l => l.on);
                const allOff = this.lorasData.every(l => !l.on);
                const toggleX = margin;
                const toggleY = midY - toggleHeight / 2;
                
                // Draw pill background
                ctx.beginPath();
                ctx.roundRect(toggleX, toggleY, toggleWidth, toggleHeight, toggleRadius);
                ctx.fillStyle = allOn ? "#4a9eff" : "#444";
                ctx.fill();
                
                // Draw knob (circle inside)
                const knobX = allOn ? toggleX + toggleWidth - knobRadius - 3 : toggleX + knobRadius + 3;
                ctx.beginPath();
                ctx.arc(knobX, midY, knobRadius, 0, Math.PI * 2);
                ctx.fillStyle = "#fff";
                ctx.fill();
                
                // "Toggle All" text
                ctx.fillStyle = "#999";
                ctx.font = "11px sans-serif";
                ctx.textAlign = "left";
                ctx.textBaseline = "middle";
                ctx.fillText("Toggle All", margin + toggleWidth + 8, midY);
                
                // "Strength" header
                ctx.textAlign = "right";
                ctx.fillText("Strength", nodeWidth - margin - 5, midY);
                
                y += rowHeight;
            }
            
            // Draw each lora row
            if (this.lorasData) {
                for (let i = 0; i < this.lorasData.length; i++) {
                    const lora = this.lorasData[i];
                    const midY = y + rowHeight / 2;
                    
                    // Toggle pill shape (same as header)
                    const toggleX = margin;
                    const toggleY = midY - toggleHeight / 2;
                    
                    // Draw pill background
                    ctx.beginPath();
                    ctx.roundRect(toggleX, toggleY, toggleWidth, toggleHeight, toggleRadius);
                    ctx.fillStyle = lora.on ? "#4a9eff" : "#444";
                    ctx.fill();
                    
                    // Draw knob (circle inside)
                    const knobX = lora.on ? toggleX + toggleWidth - knobRadius - 3 : toggleX + knobRadius + 3;
                    ctx.beginPath();
                    ctx.arc(knobX, midY, knobRadius, 0, Math.PI * 2);
                    ctx.fillStyle = "#fff";
                    ctx.fill();
                    
                    // Lora name
                    ctx.fillStyle = lora.on ? "#ddd" : "#777";
                    ctx.font = "12px sans-serif";
                    ctx.textAlign = "left";
                    ctx.textBaseline = "middle";
                    
                    const nameX = margin + toggleWidth + 8;
                    const maxNameWidth = nodeWidth - nameX - 85;
                    let displayName = lora.lora || "Click to select...";
                    
                    // Truncate if needed
                    while (ctx.measureText(displayName).width > maxNameWidth && displayName.length > 3) {
                        displayName = displayName.slice(0, -4) + "...";
                    }
                    ctx.fillText(displayName, nameX, midY);
                    
                    // Strength controls
                    const strengthX = nodeWidth - margin - 65;
                    
                    // Left arrow
                    ctx.fillStyle = "#888";
                    ctx.font = "12px sans-serif";
                    ctx.textAlign = "center";
                    ctx.fillText("◀", strengthX, midY);
                    
                    // Strength value
                    ctx.fillStyle = lora.on ? "#ddd" : "#777";
                    ctx.fillText(lora.strength.toFixed(2), strengthX + 30, midY);
                    
                    // Right arrow
                    ctx.fillStyle = "#888";
                    ctx.fillText("▶", strengthX + 60, midY);
                    
                    y += rowHeight;
                }
            }
            
            // Draw "Add Lora" button
            const btnY = y + 4;
            const btnHeight = rowHeight - 4;
            
            ctx.fillStyle = "#3a3a3a";
            ctx.beginPath();
            ctx.roundRect(margin, btnY, nodeWidth - margin * 2, btnHeight, 3);
            ctx.fill();
            
            ctx.fillStyle = "#bbb";
            ctx.font = "12px sans-serif";
            ctx.textAlign = "center";
            ctx.textBaseline = "middle";
            ctx.fillText("+ Add Lora", nodeWidth / 2, btnY + btnHeight / 2);
            
            // Update node size
            const totalHeight = y + rowHeight + 10;
            if (this.size[1] < totalHeight) {
                this.size[1] = totalHeight;
            }
        };
        
        // Helper to get which lora row was clicked
        nodeType.prototype.getLoraIndexAtPos = function(localY) {
            const rowHeight = 24;
            let currentY = 30;
            
            // Skip header if there are loras
            if (this.lorasData && this.lorasData.length > 0) {
                currentY += rowHeight;
            }
            
            // Check each lora row
            if (this.lorasData) {
                for (let i = 0; i < this.lorasData.length; i++) {
                    if (localY >= currentY && localY < currentY + rowHeight) {
                        return i;
                    }
                    currentY += rowHeight;
                }
            }
            return -1;
        };
        
        // Mouse handling
        const origOnMouseDown = nodeType.prototype.onMouseDown;
        nodeType.prototype.onMouseDown = function(e, localPos, graphCanvas) {
            if (origOnMouseDown?.apply(this, arguments)) return true;
            
            const x = localPos[0];
            const y = localPos[1];
            const nodeWidth = this.size[0];
            const rowHeight = 24;
            const margin = 12;
            const toggleWidth = 26;
            
            let currentY = 30;
            
            // Check header toggle all
            if (this.lorasData && this.lorasData.length > 0) {
                if (y >= currentY && y < currentY + rowHeight) {
                    if (x >= margin && x <= margin + toggleWidth + 4) {
                        // Toggle all
                        const allOn = this.lorasData.every(l => l.on);
                        this.lorasData.forEach(l => l.on = !allOn);
                        this.setDirtyCanvas(true, true);
                        return true;
                    }
                }
                currentY += rowHeight;
            }
            
            // Check lora rows
            if (this.lorasData) {
                for (let i = 0; i < this.lorasData.length; i++) {
                    if (y >= currentY && y < currentY + rowHeight) {
                        const lora = this.lorasData[i];
                        
                        // Toggle click (pill shape area)
                        if (x >= margin && x <= margin + toggleWidth + 4) {
                            lora.on = !lora.on;
                            this.setDirtyCanvas(true, true);
                            return true;
                        }
                        
                        // Name click - show lora selector
                        const nameX = margin + toggleWidth + 8;
                        const strengthX = nodeWidth - margin - 65;
                        if (x >= nameX && x < strengthX - 10) {
                            this.showLoraMenu(i);
                            return true;
                        }
                        
                        // Left arrow (decrease)
                        if (x >= strengthX - 10 && x < strengthX + 15) {
                            lora.strength = Math.max(-10, Math.round((lora.strength - 0.05) * 100) / 100);
                            this.setDirtyCanvas(true, true);
                            return true;
                        }
                        
                        // Right arrow (increase)
                        if (x >= strengthX + 45) {
                            lora.strength = Math.min(10, Math.round((lora.strength + 0.05) * 100) / 100);
                            this.setDirtyCanvas(true, true);
                            return true;
                        }
                        
                        // Strength value click - use ComfyUI prompt
                        if (x >= strengthX + 15 && x < strengthX + 45) {
                            this.showStrengthPrompt(i, e);
                            return true;
                        }
                    }
                    currentY += rowHeight;
                }
            }
            
            // Check add button
            const btnY = currentY + 4;
            const btnHeight = rowHeight - 4;
            if (y >= btnY && y < btnY + btnHeight && x >= margin && x <= nodeWidth - margin) {
                this.addLora();
                return true;
            }
            
            return false;
        };
        
        // Show ComfyUI native prompt for strength
        nodeType.prototype.showStrengthPrompt = function(index, event) {
            const lora = this.lorasData[index];
            const node = this;
            
            // Use ComfyUI's canvas prompt
            app.canvas.prompt("Value", lora.strength, function(v) {
                const num = parseFloat(v);
                if (!isNaN(num)) {
                    lora.strength = Math.max(-10, Math.min(10, num));
                    node.setDirtyCanvas(true, true);
                }
            }, event);
        };
        
        // Add lora method - opens lora selector immediately
        nodeType.prototype.addLora = async function() {
            if (!this.lorasData) this.lorasData = [];
            const newIndex = this.lorasData.length;
            this.lorasData.push({
                on: true,
                lora: null,
                strength: 1.0
            });
            this.size[1] += 24;
            this.setDirtyCanvas(true, true);
            
            // Open lora selector immediately
            this.showLoraMenu(newIndex);
        };
        
        // Show lora menu
        nodeType.prototype.showLoraMenu = async function(index) {
            const loras = await loadLorasList();
            const items = [
                { content: "None", callback: () => {
                    this.lorasData[index].lora = null;
                    this.setDirtyCanvas(true, true);
                }},
                null
            ];
            
            for (const lora of loras) {
                items.push({
                    content: lora,
                    callback: () => {
                        this.lorasData[index].lora = lora;
                        this.setDirtyCanvas(true, true);
                    }
                });
            }
            
            new LiteGraph.ContextMenu(items, {
                title: "Select LoRA",
                event: window.event
            });
        };
        
        // Override getSlotInPosition to detect clicks on LoRA rows
        // This is the rgthree approach - hijack the slot system
        const origGetSlotInPosition = nodeType.prototype.getSlotInPosition;
        nodeType.prototype.getSlotInPosition = function(canvasX, canvasY) {
            const slot = origGetSlotInPosition?.apply(this, arguments);
            
            // If no slot found, check if click is on a lora row
            if (!slot) {
                const localY = canvasY - this.pos[1];
                const loraIndex = this.getLoraIndexAtPos(localY);
                
                if (loraIndex >= 0) {
                    // Return a fake "slot" with our lora data
                    return {
                        loraWidget: true,
                        loraIndex: loraIndex,
                        output: { type: "LORA WIDGET" }
                    };
                }
            }
            return slot;
        };
        
        // Override getSlotMenuOptions to show our custom menu
        const origGetSlotMenuOptions = nodeType.prototype.getSlotMenuOptions;
        nodeType.prototype.getSlotMenuOptions = function(slot) {
            // Check if this is our fake lora widget slot
            if (slot?.loraWidget && slot.loraIndex >= 0) {
                const node = this;
                const index = slot.loraIndex;
                const lora = node.lorasData[index];
                const canMoveUp = index > 0;
                const canMoveDown = index < node.lorasData.length - 1;
                
                const menuItems = [
                    {
                        content: lora.on ? "⚫ Toggle Off" : "🔵 Toggle On",
                        callback: () => {
                            lora.on = !lora.on;
                            node.setDirtyCanvas(true, true);
                        }
                    },
                    {
                        content: "⬆️ Move Up",
                        disabled: !canMoveUp,
                        callback: () => {
                            if (canMoveUp) {
                                const temp = node.lorasData[index - 1];
                                node.lorasData[index - 1] = node.lorasData[index];
                                node.lorasData[index] = temp;
                                node.setDirtyCanvas(true, true);
                            }
                        }
                    },
                    {
                        content: "⬇️ Move Down",
                        disabled: !canMoveDown,
                        callback: () => {
                            if (canMoveDown) {
                                const temp = node.lorasData[index + 1];
                                node.lorasData[index + 1] = node.lorasData[index];
                                node.lorasData[index] = temp;
                                node.setDirtyCanvas(true, true);
                            }
                        }
                    },
                    {
                        content: "🗑️ Remove",
                        callback: () => {
                            node.lorasData.splice(index, 1);
                            node.size[1] = Math.max(80, node.size[1] - 24);
                            node.setDirtyCanvas(true, true);
                        }
                    }
                ];
                
                // Show our custom menu
                new LiteGraph.ContextMenu(menuItems, {
                    title: "LORA WIDGET",
                    event: window.event
                });
                
                // Return undefined to prevent default menu
                return undefined;
            }
            
            return origGetSlotMenuOptions?.apply(this, arguments);
        };
        
        // Serialization
        const origOnSerialize = nodeType.prototype.onSerialize;
        nodeType.prototype.onSerialize = function(o) {
            origOnSerialize?.apply(this, arguments);
            o.lorasData = this.lorasData || [];
        };
        
        const origOnConfigure = nodeType.prototype.onConfigure;
        nodeType.prototype.onConfigure = function(o) {
            origOnConfigure?.apply(this, arguments);
            this.lorasData = o.lorasData || [];
            // Adjust size for loaded loras
            const rowHeight = 24;
            const baseHeight = 80;
            const headerHeight = this.lorasData.length > 0 ? rowHeight : 0;
            this.size[1] = baseHeight + headerHeight + this.lorasData.length * rowHeight;
        };
        
        // Make sure our data is sent to the backend
        const origOnExecute = nodeType.prototype.onExecute;
        nodeType.prototype.onExecute = function() {
            if (this.lorasData) {
                for (let i = 0; i < this.lorasData.length; i++) {
                    const lora = this.lorasData[i];
                    this.inputs_data = this.inputs_data || {};
                    this.inputs_data[`lora_${i + 1}`] = {
                        on: lora.on,
                        lora: lora.lora,
                        strength: lora.strength
                    };
                }
            }
            return origOnExecute?.apply(this, arguments);
        };
    },
    
    async nodeCreated(node) {
        if (node.type !== NODE_TYPE) return;
        
        const origSerialize = node.serialize;
        node.serialize = function() {
            const data = origSerialize?.apply(this, arguments) || {};
            data.lorasData = this.lorasData || [];
            return data;
        };
    }
});

// Override the node's API call to include lora data
const origQueuePrompt = api.queuePrompt;
api.queuePrompt = async function(number, { output, workflow }) {
    for (const nodeId in output) {
        const node = output[nodeId];
        if (node.class_type === NODE_TYPE) {
            const graphNode = app.graph._nodes_by_id[nodeId];
            if (graphNode?.lorasData) {
                for (let i = 0; i < graphNode.lorasData.length; i++) {
                    const lora = graphNode.lorasData[i];
                    node.inputs[`lora_${i + 1}`] = {
                        on: lora.on,
                        lora: lora.lora,
                        strength: lora.strength
                    };
                }
            }
        }
    }
    return origQueuePrompt.apply(this, arguments);
};

console.log("WanVideo Power LoRA Loader loaded (v7)");
