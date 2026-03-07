// Hardware Detection Module for Mixiee Website
class HardwareDetector {
    constructor() {
        this.detectedHardware = {
            cpu: null,
            gpu: null,
            memory: null,
            monitors: [],
            peripherals: {
                keyboard: null,
                mouse: null
            }
        };
        this.fallbackData = {
            cpu: {
                name: 'AMD Ryzen 7 9800X3D',
                cores: 8,
                threads: 16,
                baseSpeed: '4.7 GHz',
                maxSpeed: '5.2 GHz',
                cache: '96 MB 3D V-Cache'
            },
            gpu: [
                {
                    name: 'NVIDIA GeForce RTX 5070',
                    memory: '4 GB GDDR6X',
                    type: 'Dedicated',
                    role: 'Primary Gaming'
                },
                {
                    name: 'AMD Radeon Graphics',
                    memory: '512 MB + 15.6 GB Shared',
                    type: 'Integrated',
                    role: 'Desktop/Video Output'
                }
            ],
            memory: {
                total: '32 GB',
                type: 'DDR5',
                channels: 'Dual-channel',
                usable: '31.1 GB'
            },
            monitors: [
                {
                    name: 'MSI AG32CV',
                    resolution: '2560x1440',
                    refreshRate: '165 Hz',
                    panel: 'VA Curved',
                    size: '32"'
                },
                {
                    name: 'MSI G2412',
                    resolution: '1920x1080',
                    refreshRate: '100 Hz',
                    panel: 'IPS',
                    size: '24"'
                }
            ],
            peripherals: {
                keyboard: {
                    name: 'Wooting 80 HE',
                    type: 'Mechanical Gaming',
                    switches: 'Hall Effect',
                    layout: '80% TKL',
                    features: ['Rapid Trigger', 'Analog Input', 'RGB']
                },
                mouse: {
                    name: 'Glorious Model O Pro Forge',
                    type: 'Gaming Mouse',
                    sensor: 'BAMF 2.0',
                    dpi: 'Up to 26,000',
                    weight: '49g',
                    features: ['Wireless', 'RGB', 'Honeycomb Shell']
                }
            }
        };
    }

    async detectAll() {
        console.log('🔍 Starting hardware detection...');
        
        try {
            await Promise.all([
                this.detectCPU(),
                this.detectGPU(),
                this.detectMemory(),
                this.detectMonitors(),
                this.detectPeripherals()
            ]);
            
            console.log('✅ Hardware detection completed:', this.detectedHardware);
            return this.detectedHardware;
        } catch (error) {
            console.warn('⚠️ Hardware detection failed, using fallback data:', error);
            return this.fallbackData;
        }
    }

    async detectCPU() {
        try {
            const cpu = {
                cores: navigator.hardwareConcurrency || 8,
                platform: navigator.platform,
                userAgent: navigator.userAgent
            };

            // Try to extract CPU info from user agent or use fallback
            if (cpu.userAgent.includes('AMD') || cpu.userAgent.includes('Ryzen')) {
                this.detectedHardware.cpu = {
                    ...this.fallbackData.cpu,
                    cores: cpu.cores,
                    detected: true
                };
            } else {
                this.detectedHardware.cpu = {
                    ...this.fallbackData.cpu,
                    cores: cpu.cores,
                    detected: false
                };
            }
        } catch (error) {
            console.warn('CPU detection failed:', error);
            this.detectedHardware.cpu = this.fallbackData.cpu;
        }
    }

    async detectGPU() {
        try {
            const canvas = document.createElement('canvas');
            const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
            
            if (gl) {
                const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
                if (debugInfo) {
                    const vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL);
                    const renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
                    
                    console.log('Detected GPU:', vendor, renderer);
                    
                    // Check if we can detect NVIDIA RTX 5070
                    if (renderer.includes('RTX') || renderer.includes('NVIDIA')) {
                        this.detectedHardware.gpu = this.fallbackData.gpu.map(gpu => ({
                            ...gpu,
                            detected: gpu.name.includes('NVIDIA')
                        }));
                    } else {
                        this.detectedHardware.gpu = this.fallbackData.gpu;
                    }
                } else {
                    this.detectedHardware.gpu = this.fallbackData.gpu;
                }
            } else {
                this.detectedHardware.gpu = this.fallbackData.gpu;
            }
        } catch (error) {
            console.warn('GPU detection failed:', error);
            this.detectedHardware.gpu = this.fallbackData.gpu;
        }
    }

    async detectMemory() {
        try {
            let totalMemory = parseInt(this.fallbackData.memory.total); // Start with manual spec (32)
            
            // Browsers often cap navigator.deviceMemory at 8 for privacy.
            // Only update if the browser reports MORE than our known spec (future-proofing).
            if ('deviceMemory' in navigator) {
                const detected = navigator.deviceMemory;
                console.log('Detected device memory:', detected, 'GB');
                if (detected > totalMemory) {
                    totalMemory = detected;
                }
            }

            this.detectedHardware.memory = {
                ...this.fallbackData.memory,
                total: `${totalMemory} GB`,
                detected: 'deviceMemory' in navigator && navigator.deviceMemory > parseInt(this.fallbackData.memory.total)
            };
        } catch (error) {
            console.warn('Memory detection failed:', error);
            this.detectedHardware.memory = this.fallbackData.memory;
        }
    }

    async detectMonitors() {
        try {
            const screen = window.screen;
            const monitors = [];
            
            // Primary monitor info
            monitors.push({
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth,
                pixelDepth: screen.pixelDepth,
                refreshRate: screen.refreshRate || 'Unknown'
            });

            // Use fallback data with detected resolution
            this.detectedHardware.monitors = this.fallbackData.monitors.map((monitor, index) => ({
                ...monitor,
                detectedResolution: index === 0 ? `${screen.width}x${screen.height}` : monitor.resolution,
                detected: true
            }));
        } catch (error) {
            console.warn('Monitor detection failed:', error);
            this.detectedHardware.monitors = this.fallbackData.monitors;
        }
    }

    async detectPeripherals() {
        try {
            // Use our known peripherals as fallback since browser APIs are limited
            this.detectedHardware.peripherals = {
                ...this.fallbackData.peripherals,
                detected: false // Browser limitations
            };

            // Try to detect gamepads if available
            if ('getGamepads' in navigator) {
                const gamepads = navigator.getGamepads();
                if (gamepads && gamepads.length > 0) {
                    console.log('Detected gamepads:', gamepads);
                }
            }
        } catch (error) {
            console.warn('Peripheral detection failed:', error);
            this.detectedHardware.peripherals = this.fallbackData.peripherals;
        }
    }

    // Get formatted hardware data for display
    getFormattedData() {
        return this.detectedHardware.cpu ? this.detectedHardware : this.fallbackData;
    }

    // Update UI with detected hardware
    updateUI() {
        const data = this.getFormattedData();
        
        // Update hero section
        this.updateHeroSection(data);
        
        // Update PC parts page if we're on it
        if (window.location.pathname.includes('pc-parts')) {
            this.updatePCPartsPage(data);
        }
    }

    updateHeroSection(data) {
        // Update CPU info in hero side card
        const cpuElement = document.querySelector('.hero-side-specs .hero-side-row:first-child dd');
        if (cpuElement && data.cpu) {
            cpuElement.textContent = `${data.cpu.name} @ ${data.cpu.baseSpeed}–${data.cpu.maxSpeed}`;
        }

        // Update GPU info
        const gpuElements = document.querySelectorAll('.hero-side-specs .hero-side-row dd');
        if (gpuElements.length >= 3 && data.gpu) {
            if (gpuElements[1]) {
                gpuElements[1].textContent = `${data.gpu[0].name} (${data.gpu[0].role.toLowerCase()})`;
            }
            if (gpuElements[2]) {
                gpuElements[2].textContent = `${data.gpu[1].name} (${data.gpu[1].role.toLowerCase()})`;
            }
        }

        // Update memory info
        const memoryElement = document.querySelector('.hero-side-specs .hero-side-row:last-child dd');
        if (memoryElement && data.memory) {
            memoryElement.textContent = `${data.memory.total} ${data.memory.type}`;
        }
    }

    updatePCPartsPage(data) {
        // This will be called when on PC parts page
        console.log('Updating PC parts page with:', data);
        
        // Update build summary
        const buildTitle = document.querySelector('.build-summary-card .part-model');
        if (buildTitle) {
            buildTitle.textContent = `${data.cpu.name} • Dual-GPU Setup`;
        }

        // Update individual component cards
        this.updateComponentCards(data);
    }

    updateComponentCards(data) {
        // Update CPU card
        const cpuCard = document.querySelector('.part-card.part-cpu');
        if (cpuCard && data.cpu) {
            const cpuModel = cpuCard.querySelector('.part-model');
            if (cpuModel) cpuModel.textContent = data.cpu.name;
            
            const specs = cpuCard.querySelectorAll('.part-spec-value');
            if (specs.length >= 4) {
                specs[0].textContent = `${data.cpu.cores} physical`;
                specs[1].textContent = data.cpu.baseSpeed;
                specs[2].textContent = data.cpu.maxSpeed;
                specs[3].textContent = data.cpu.cache;
            }
        }

        // Update GPU cards
        const gpuCards = document.querySelectorAll('.part-card.part-gpu');
        if (gpuCards.length >= 2 && data.gpu) {
            // Primary GPU
            if (gpuCards[0]) {
                const gpuModel = gpuCards[0].querySelector('.part-model');
                if (gpuModel) gpuModel.textContent = data.gpu[0].name;
            }
            
            // Integrated GPU
            if (gpuCards[1]) {
                const gpuModel = gpuCards[1].querySelector('.part-model');
                if (gpuModel) gpuModel.textContent = data.gpu[1].name;
            }
        }

        // Update peripheral cards
        this.updatePeripheralCards(data);
    }

    updatePeripheralCards(data) {
        // Update keyboard card
        const keyboardCard = document.querySelector('.part-card.part-keyboard');
        if (keyboardCard && data.peripherals.keyboard) {
            const keyboardModel = keyboardCard.querySelector('.part-model');
            if (keyboardModel) keyboardModel.textContent = data.peripherals.keyboard.name;
            
            const specs = keyboardCard.querySelectorAll('.part-spec-value');
            if (specs.length >= 3) {
                specs[0].textContent = data.peripherals.keyboard.layout;
                specs[1].textContent = data.peripherals.keyboard.switches;
                specs[2].textContent = 'Wired USB + Wireless';
            }
        }

        // Update mouse card
        const mouseCard = document.querySelector('.part-card.part-mouse');
        if (mouseCard && data.peripherals.mouse) {
            const mouseModel = mouseCard.querySelector('.part-model');
            if (mouseModel) mouseModel.textContent = data.peripherals.mouse.name;
            
            const specs = mouseCard.querySelectorAll('.part-spec-value');
            if (specs.length >= 3) {
                specs[0].textContent = data.peripherals.mouse.sensor;
                specs[1].textContent = '6 + Scroll';
                specs[2].textContent = 'Wireless + Wired';
            }
        }

        // Update monitor cards
        const monitorCards = document.querySelectorAll('.part-card.part-monitor');
        if (monitorCards.length > 0 && data.monitors) {
            data.monitors.forEach((monitor, index) => {
                if (monitorCards[index]) {
                    const monitorModel = monitorCards[index].querySelector('.part-model');
                    if (monitorModel) monitorModel.textContent = monitor.name;
                    
                    const specs = monitorCards[index].querySelectorAll('.part-spec-value');
                    if (specs.length >= 3) {
                        specs[0].textContent = monitor.detectedResolution || monitor.resolution;
                        specs[1].textContent = monitor.refreshRate;
                        specs[2].textContent = monitor.panel;
                    }
                }
            });
        }
    }
}

// Initialize hardware detection when DOM is loaded
document.addEventListener('DOMContentLoaded', async function() {
    console.log('🚀 Initializing Mixiee Hardware Detection...');
    
    const detector = new HardwareDetector();
    
    // Show loading state
    const statusPill = document.querySelector('.status-pill');
    if (statusPill) {
        statusPill.innerHTML = '<span class="status-dot"></span>DETECTING HARDWARE';
    }
    
    try {
        // Detect hardware
        await detector.detectAll();
        
        // Update UI with detected data
        detector.updateUI();
        
        // Update status
        if (statusPill) {
            statusPill.innerHTML = '<span class="status-dot"></span>SYSTEM DETECTED';
        }
        
        console.log('✅ Hardware detection and UI update completed!');
    } catch (error) {
        console.error('❌ Hardware detection failed:', error);
        
        if (statusPill) {
            statusPill.innerHTML = '<span class="status-dot"></span>SYSTEM ONLINE';
        }
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HardwareDetector;
}