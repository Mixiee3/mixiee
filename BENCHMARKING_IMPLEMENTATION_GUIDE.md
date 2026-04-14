# Mixiee Benchmarking Implementation Guide

## Developer Reference Document — Open-Source Benchmarking Tools & Architecture

**Version:** 1.0
**Date:** April 2026
**Purpose:** Comprehensive technical reference for implementing an integrated benchmarking suite into the Mixiee tuning utility. This document covers open-source tools, libraries, APIs, integration strategies, and architectural recommendations for building one of the most accurate and reliable benchmarking experiences — while keeping resource consumption minimal.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [CPU Benchmarking](#3-cpu-benchmarking)
4. [GPU Benchmarking](#4-gpu-benchmarking)
5. [Disk / Storage Benchmarking](#5-disk--storage-benchmarking)
6. [Network Benchmarking](#6-network-benchmarking)
7. [Latency Benchmarking (System / DPC / Input)](#7-latency-benchmarking-system--dpc--input)
8. [Hardware Monitoring & Telemetry](#8-hardware-monitoring--telemetry)
9. [Cross-Cutting: Phoronix Test Suite (Meta-Framework)](#9-cross-cutting-phoronix-test-suite-meta-framework)
10. [Comparison Matrix](#10-comparison-matrix)
11. [Recommended Implementation Stack](#11-recommended-implementation-stack)
12. [Before/After Tuning — Scoring Strategy](#12-beforeafter-tuning--scoring-strategy)
13. [Resource Consumption Guidelines](#13-resource-consumption-guidelines)
14. [Licensing Summary](#14-licensing-summary)
15. [References & Links](#15-references--links)

---

## 1. Executive Summary

Mixiee aims to become a top-tier benchmarking app alongside its existing system-tuning capabilities. The goal is to accurately measure hardware performance across **CPU, GPU, Disk, Network, and Latency** — so users can see the real impact of tuning tweaks on their devices.

This guide catalogs the best open-source benchmarking tools available, evaluates their accuracy, resource usage, platform support, and license compatibility, and provides a clear integration roadmap for the development team.

### Key Design Principles

- **Accuracy First:** Use tools trusted by the industry (fio, iperf3, DiskSpd, vkpeak, etc.)
- **Low Resource Consumption:** Benchmarks should be short, targeted, and cleanup after themselves
- **Before/After Comparison:** Every benchmark must produce a numeric score that can be compared pre- and post-tuning
- **Windows-First:** Primary target is Windows 10/11 (with Linux as a secondary target)
- **Open Source:** All core tools must be open-source with permissive or compatible licenses
- **Modular:** Each benchmark category should be an independent module that can run solo or as part of a full suite

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    MIXIEE APP (Frontend)                 │
│              Next.js / Electron / Tauri UI               │
├─────────────────────────────────────────────────────────┤
│                  BENCHMARK ORCHESTRATOR                  │
│    (Manages test execution, scheduling, result storage)  │
├──────────┬──────────┬──────────┬──────────┬─────────────┤
│   CPU    │   GPU    │   DISK   │ NETWORK  │  LATENCY    │
│  Module  │  Module  │  Module  │  Module  │  Module     │
├──────────┴──────────┴──────────┴──────────┴─────────────┤
│               HARDWARE MONITORING LAYER                  │
│        (LibreHardwareMonitor / WMI / Telemetry)          │
├─────────────────────────────────────────────────────────┤
│                    RESULTS ENGINE                        │
│    (Scoring, comparison, history, export to JSON/CSV)    │
└─────────────────────────────────────────────────────────┘
```

**Suggested App Framework:** If building as a desktop app, consider **Tauri** (Rust backend + web frontend) or **Electron** — both can spawn native processes (the benchmarking tools) and capture their stdout/JSON output.

---

## 3. CPU Benchmarking

### 3.1 sysbench — CPU Module

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/akopytov/sysbench |
| **License** | GPLv2 |
| **Language** | C + LuaJIT |
| **Platforms** | Linux, macOS, Windows (via WSL) |
| **What it measures** | CPU computational throughput (prime number calculation), multi-threaded performance |
| **Key command** | `sysbench cpu --cpu-max-prime=20000 --threads=N run` |
| **Output** | Events/sec, latency percentiles (min/avg/max/p95/p99), total time |
| **Resource usage** | Very low — runs for a few seconds, pure CPU-bound, no disk/network |
| **Stars** | 6k+ |

**Why it's good for Mixiee:**
- Industry-standard micro-benchmark
- Extremely configurable thread count and workload size
- Built-in latency histograms
- JSON-parseable output available
- Can scale from a 2-second quick test to a 60-second stress test

**Integration approach:**
- Bundle the sysbench binary or invoke via WSL on Windows
- Parse JSON output for scoring
- Run with `--threads=1` for single-core and `--threads=<core_count>` for multi-core scores

### 3.2 stress-ng (Stress Test & Throughput Measurement)

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/ColinIanKing/stress-ng |
| **License** | GPLv2+ |
| **Language** | C |
| **Platforms** | Linux, BSD, macOS, Windows (WSL/Cygwin), Android |
| **What it measures** | 370+ stressor types covering CPU (integer, float, bit manipulation, matrix ops, crypto, etc.), memory, cache |
| **Key command** | `stress-ng --cpu 4 --cpu-method matrixprod --metrics-brief -t 10` |
| **Output** | Bogo-ops/sec per stressor, real-time metrics |
| **Resource usage** | Configurable — can run for as short as 1 second |

**Why it's good for Mixiee:**
- 100+ CPU-specific stress tests (floating point, integer, SIMD, AES, SHA, matrix multiply)
- Can target specific CPU features to show tuning impact (e.g., power plan changes, affinity tweaks)
- Built-in throughput measurement mode
- Extremely portable

**Integration approach:**
- Use specific stressors that represent real-world workloads:
  - `--cpu-method matrixprod` (matrix multiplication — represents scientific/gaming workloads)
  - `--cpu-method fft` (FFT — represents audio/signal processing)
  - `--cpu-method ackermann` (recursive — represents compiler/algorithm workloads)
- Parse metrics output for before/after comparison

### 3.3 UnixBench (BYTE Unix Benchmark)

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/kdlucas/byte-unixbench |
| **License** | GPLv2 |
| **Language** | C + Shell |
| **Platforms** | Linux/Unix |
| **What it measures** | Dhrystone (integer), Whetstone (floating point), execl throughput, pipe throughput, context switching, process creation, shell scripts, system call overhead |
| **Output** | Index score relative to baseline (SPARCstation 20-61 = 10.0) |
| **Resource usage** | Moderate — full suite takes ~30 minutes, individual tests are quick |

**Why it's good for Mixiee:**
- Produces a single composite score (easy for users to understand)
- Tests both single-threaded and multi-threaded (N = CPU count)
- Includes Dhrystone and Whetstone — classic and widely understood benchmarks
- Good for showing "overall system CPU improvement"

**Integration approach:**
- Run a subset of tests (Dhrystone + Whetstone + Pipe) for a quick ~2 minute benchmark
- Use the index score as Mixiee's "CPU Score"

### 3.4 Google Benchmark (Micro-benchmark Library)

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/google/benchmark |
| **License** | Apache 2.0 |
| **Language** | C++ |
| **Platforms** | Windows, Linux, macOS |
| **What it measures** | Custom micro-benchmarks — you define what to measure |
| **Output** | JSON/CSV with nanosecond-precision timing |

**Why it's good for Mixiee:**
- Build custom CPU benchmarks tailored to your specific tuning scenarios
- Nanosecond precision timing with statistical analysis
- Perfect for creating "Mixiee-branded" CPU tests
- Apache 2.0 license — very permissive, commercially friendly

**Integration approach:**
- Write custom C++ benchmark functions that simulate real workloads
- Compile as a DLL/shared library and invoke from the Mixiee app
- Full control over what you measure and how you score it

---

## 4. GPU Benchmarking

### 4.1 vkpeak — Vulkan Peak Performance

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/nihui/vkpeak |
| **License** | MIT |
| **Language** | C++ (Vulkan compute shaders) |
| **Platforms** | Windows, Linux, macOS (via MoltenVK), Android |
| **GPU support** | Intel, AMD, NVIDIA, Apple (any Vulkan-capable GPU) |
| **What it measures** | Peak GFLOPS (fp32, fp16, fp64), peak GIOPS (int32, int16, int8), memory bandwidth (host-to-device, device-to-device, etc.) |
| **Key command** | `vkpeak.exe [device_id] [scenario]` |
| **Output** | GFLOPS / GIOPS / GBPS per scenario |
| **Resource usage** | Very low — runs in a few seconds, pure synthetic compute |

**Why it's good for Mixiee:**
- ⭐ **TOP RECOMMENDATION FOR GPU BENCHMARKING** ⭐
- Cross-vendor (AMD, NVIDIA, Intel) via Vulkan — no vendor lock-in
- Measures actual compute throughput, not just a framerate proxy
- MIT license — fully permissive, can embed in commercial products
- Lightweight and fast — perfect for quick before/after comparisons
- Covers FP32, FP16, INT8, matrix ops, memory bandwidth
- Available scenarios: `fp32-scalar`, `fp32-vec4`, `fp16-scalar`, `fp16-vec4`, `fp16-matrix`, `fp64-scalar`, `fp64-vec4`, `int32-scalar`, `int32-vec4`, `int16-scalar`, `int16-vec4`, `int64-scalar`, `int64-vec4`, `int8-dotprod`, `int8-matrix`, `bf16-dotprod`, `bf16-matrix`, `copy-h2h`, `copy-h2d`, `copy-d2h`, `copy-d2d`

**Sample output (NVIDIA RTX 5060Ti):**
```
fp32-scalar  = 17137.46 GFLOPS
fp16-matrix  = 101485.35 GFLOPS
int8-matrix  = 202947.80 GIOPS
copy-d2d     = 190.70 GBPS
```

**Integration approach:**
- Bundle the vkpeak binary (it's a single executable)
- Run specific scenarios: `fp32-vec4` (general GPU compute), `copy-d2d` (VRAM bandwidth)
- Parse stdout for GFLOPS/GBPS values
- Create a composite "GPU Score" from weighted fp32 + memory bandwidth results

### 4.2 GPUPerfAPI (AMD GPU Performance API)

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/GPUOpen-Tools/gpu_performance_api |
| **License** | MIT |
| **Language** | C/C++ |
| **Platforms** | Windows, Linux |
| **GPU support** | AMD Radeon (RDNA/RDNA2/RDNA3 — GFX IP v10+) |
| **What it measures** | GPU hardware performance counters — shader utilization, memory bandwidth, cache hit rates, occupancy, wavefront stats |
| **APIs supported** | Vulkan, DirectX 12, DirectX 11, OpenGL |

**Why it's good for Mixiee:**
- Deep hardware-level performance data (not just FLOPS but actual GPU utilization %)
- Shows exactly how GPU resources are being used
- Can demonstrate tuning impact at the hardware counter level (e.g., "your GPU clock tweak increased shader utilization by 15%")
- Used by Radeon GPU Profiler — proven reliability

**Limitation:** AMD-only. For NVIDIA, equivalent functionality requires NVAPI (proprietary) or NVIDIA Nsight.

**Integration approach:**
- Use as a supplementary data source on AMD systems
- Link against the GPA library and query counters during GPU benchmarks
- Show detailed GPU metrics alongside vkpeak scores

### 4.3 PresentMon (Frame Timing & Display Latency)

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/GameTechDev/PresentMon |
| **License** | MIT |
| **Language** | C++ |
| **Platforms** | Windows |
| **What it measures** | CPU frame time, GPU frame time, display latency, input latency, frame pacing, GPU active time |
| **APIs supported** | DirectX 11/12, OpenGL, Vulkan |

**Why it's good for Mixiee:**
- ⭐ **CRITICAL FOR GAMING LATENCY MEASUREMENT** ⭐
- Industry-standard tool used by AMD OCAT, CapFrameX, NVIDIA FrameView
- Measures the full frame delivery pipeline: CPU render → GPU render → Display
- Includes input-to-display latency measurement
- CSV output with per-frame data
- PresentMon Service provides a C++ API for programmatic access
- Includes hardware telemetry (GPU power, temperature, utilization via vendor APIs)

**Integration approach:**
- Use the PresentMon Service + API for programmatic integration
- Capture frame timing during a short GPU benchmark workload
- Report: avg FPS, 1% low FPS, 0.1% low FPS, frame time consistency, input latency
- Compare frame times before/after tuning to show smoothness improvement

### 4.4 MangoHud (Overlay & Logging — Linux)

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/flightlessmango/MangoHud |
| **License** | MIT |
| **Language** | C++ |
| **Platforms** | Linux |
| **What it measures** | FPS, frame times, CPU/GPU load, temperatures, VRAM usage |

**Why it's good for Mixiee (Linux):**
- Real-time overlay + CSV logging
- Supports both Vulkan and OpenGL
- Can log to CSV for post-analysis
- Companion tool `mangoplot` for visualization

### 4.5 Radeon GPU Profiler (RGP)

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/GPUOpen-Tools/radeon_gpu_profiler |
| **License** | MIT |
| **Language** | C++ |
| **Platforms** | Windows 10/11, Ubuntu 24.04 |
| **GPU support** | AMD Radeon RX 5000/6000/7000/9000 series |

**Why it's good for Mixiee:**
- Deep GPU profiling with hardware thread-tracing
- Visualizes how DirectX 12 and Vulkan workloads interact with GPU hardware
- Can show impact of GPU clock/power tuning at the shader level

---

## 5. Disk / Storage Benchmarking

### 5.1 fio (Flexible I/O Tester)

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/axboe/fio |
| **License** | GPLv2 |
| **Language** | C |
| **Platforms** | Linux, Windows (via Cygwin or native MSI installer), macOS, BSDs, Android |
| **What it measures** | Sequential read/write, random read/write, mixed workloads, IOPS, bandwidth, latency |
| **Output** | JSON output with detailed IOPS, bandwidth (MB/s), latency (min/avg/max/p99), completion latency histograms |
| **Resource usage** | Configurable — can run a 4K random read test in 5 seconds |

**Why it's good for Mixiee:**
- ⭐ **INDUSTRY GOLD STANDARD FOR DISK BENCHMARKING** ⭐
- Used by every major storage vendor, cloud provider, and review site
- Extremely flexible — can simulate any I/O workload
- JSON output makes it easy to parse programmatically
- Windows installer available since fio 3.31
- Supports all I/O engines: sync, async (libaio), io_uring, Windows IOCP

**Key test profiles for Mixiee:**

```ini
# Sequential Read (measures sustained throughput)
[seq-read]
rw=read
bs=1M
size=1G
numjobs=1
runtime=10
time_based=1

# Sequential Write
[seq-write]
rw=write
bs=1M
size=1G
numjobs=1
runtime=10
time_based=1

# Random Read 4K (measures IOPS — most important for responsiveness)
[rand-read-4k]
rw=randread
bs=4k
size=1G
numjobs=4
iodepth=32
runtime=10
time_based=1

# Random Write 4K
[rand-write-4k]
rw=randwrite
bs=4k
size=1G
numjobs=4
iodepth=32
runtime=10
time_based=1

# Mixed Random Read/Write (70/30 — simulates real usage)
[mixed-rw]
rw=randrw
rwmixread=70
bs=4k
size=1G
numjobs=4
iodepth=32
runtime=10
time_based=1
```

**Integration approach:**
- Bundle fio Windows binary (available from GitHub releases)
- Create pre-defined job files for quick/standard/thorough test modes
- Parse JSON output (`--output-format=json+`)
- Key metrics to extract:
  - **Sequential Read MB/s** (shows raw drive speed)
  - **Sequential Write MB/s**
  - **4K Random Read IOPS** (shows drive responsiveness)
  - **4K Random Write IOPS**
  - **Average latency** and **p99 latency** (shows consistency)
- Create composite "Disk Score" from weighted metrics

### 5.2 DiskSpd (Microsoft)

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/microsoft/diskspd |
| **License** | MIT |
| **Language** | C++ |
| **Platforms** | Windows only (8+, Server 2012+) |
| **What it measures** | Same as fio but Windows-native: sequential/random read/write, IOPS, bandwidth, latency, CPU usage |
| **Output** | Text + XML with detailed per-thread statistics |
| **Resource usage** | Very low — single lightweight exe |

**Why it's good for Mixiee:**
- ⭐ **BEST FOR NATIVE WINDOWS DISK BENCHMARKING** ⭐
- Made by Microsoft — uses native Windows I/O stack (no translation layer)
- Single portable .exe — no installation needed
- Supports direct I/O (bypass file system cache), write-through, memory-mapped I/O
- Latency histograms to 9-nines precision
- Reports CPU usage during I/O (useful for showing efficiency improvements)
- Reports processor topology: Socket, NUMA, Core, big/little cores (Windows 11 Arm)

**Key commands for Mixiee:**

```powershell
# Sequential Read 1MB blocks, 1 thread, 10 seconds, disable caching
diskspd -b1M -d10 -o4 -t1 -Sh -r -W5 -L testfile.dat

# Random Read 4K, 4 threads, queue depth 32, 10 seconds
diskspd -b4K -d10 -o32 -t4 -Sh -r -W5 -L testfile.dat

# Sequential Write
diskspd -b1M -d10 -o4 -t1 -Sh -w100 -W5 -L testfile.dat

# Random Write 4K
diskspd -b4K -d10 -o32 -t4 -Sh -w100 -W5 -L testfile.dat
```

**Integration approach:**
- Bundle the single DiskSpd.exe (download from GitHub releases — ~200KB)
- Execute via process spawn, capture XML output (`-Rxml`)
- Parse XML for: ReadBytes/s, WriteBytes/s, IOps, AvgLatencyMs, Latency buckets
- **Recommended as PRIMARY disk benchmark for Windows** (fio as secondary/cross-platform)

### 5.3 Comparison: fio vs DiskSpd

| Feature | fio | DiskSpd |
|---------|-----|---------|
| **Platform** | Cross-platform | Windows only |
| **I/O Engine** | Many (libaio, io_uring, IOCP) | Windows native IOCP |
| **License** | GPLv2 | MIT |
| **JSON output** | ✅ Native | ❌ (XML/Text) |
| **Latency precision** | Microseconds | Nanoseconds (9-nines) |
| **Windows native** | Via Cygwin/installer | ✅ Fully native |
| **Community** | Massive (Linux world) | Microsoft-maintained |
| **Recommendation** | Use on Linux, secondary on Windows | **Primary on Windows** |

---

## 6. Network Benchmarking

### 6.1 iperf3 (Network Bandwidth)

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/esnet/iperf |
| **License** | BSD 3-Clause |
| **Language** | C |
| **Platforms** | Linux, macOS, FreeBSD, Windows (community builds) |
| **What it measures** | TCP/UDP bandwidth, jitter, packet loss |
| **Output** | JSON with per-interval and summary statistics |
| **Resource usage** | Minimal — pure network test |

**Why it's good for Mixiee:**
- ⭐ **INDUSTRY STANDARD FOR NETWORK BANDWIDTH TESTING** ⭐
- Used by every ISP, network engineer, and data center
- JSON output for easy parsing
- Measures: throughput (Mbps/Gbps), retransmits, jitter, packet loss
- Both TCP and UDP support
- Can test both upload and download directions

**Key commands:**
```bash
# Server mode
iperf3 -s

# Client: TCP bandwidth test (10 seconds, 4 parallel streams)
iperf3 -c <server> -t 10 -P 4 --json

# Client: UDP bandwidth test with jitter measurement
iperf3 -c <server> -u -b 100M -t 10 --json

# Client: Reverse mode (download test)
iperf3 -c <server> -t 10 -R --json
```

**Integration approach — Two modes:**

1. **Local Network Test (LAN):**
   - Run iperf3 server on one device, client on the device being benchmarked
   - Measures actual NIC throughput and driver efficiency
   - Best for showing impact of NIC driver tuning, interrupt coalescing, RSS settings

2. **Loopback Test (Single Device):**
   - Run both server and client on the same machine (`iperf3 -c localhost`)
   - Measures network stack overhead — useful for showing TCP/IP tuning impact
   - Not a true "network" test but shows OS networking efficiency

**Challenge:** Requires a server endpoint. Options:
- Embed iperf3 server in the app (spawn as background process)
- Use Mixiee cloud servers as test endpoints
- Allow users to specify their own server

### 6.2 Ethr (Microsoft — Cross-Platform Network Tool)

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/microsoft/ethr |
| **License** | MIT |
| **Language** | Go |
| **Platforms** | Windows, Linux, macOS |
| **What it measures** | Bandwidth, connections/s, packets/s, latency (TCP/UDP/HTTP/HTTPS/ICMP), TCP connection setup latency, traceroute |
| **Output** | Text UI + log files |
| **Resource usage** | Single binary, minimal footprint |

**Why it's good for Mixiee:**
- ⭐ **BEST ALL-IN-ONE NETWORK BENCHMARK FOR WINDOWS** ⭐
- Natively cross-platform (Go binary — no dependencies)
- Combines functionality of: iperf3 + ntttcp + psping + sockperf + latte + traceroute
- Measures things iperf3 doesn't: TCP connection setup latency, connections/sec, packets/sec
- Text UI mode for real-time visualization
- MIT license — commercially friendly

**Key commands:**
```bash
# Server
ethr -s

# Bandwidth test (8 threads)
ethr -c <server> -n 8

# TCP connection latency
ethr -c <server> -t pi -p tcp -d 0

# Connections per second
ethr -c <server> -t c -n 64

# UDP packets per second
ethr -c <server> -p udp -t p -d 0

# ICMP ping latency
sudo ethr -x <target> -p icmp -t pi -d 0

# Traceroute
sudo ethr -x <target> -p icmp -t mtr -d 0
```

**Integration approach:**
- Bundle the ethr binary (single executable, ~10MB)
- Run latency tests against known Mixiee servers or public endpoints
- Key metrics to show tuning impact:
  - **TCP connection setup latency** (affected by TCP tuning, Nagle, etc.)
  - **Bandwidth** (affected by RSS, NIC driver settings, buffer sizes)
  - **Packets/sec** (affected by interrupt moderation, CPU affinity)

### 6.3 ntttcp (Microsoft — Windows Network Throughput)

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/microsoft/ntttcp |
| **License** | MIT |
| **Language** | C++ |
| **Platforms** | Windows only |
| **What it measures** | TCP/UDP throughput with precise Windows I/O completion port implementation |

**Why it's good for Mixiee:**
- Microsoft's own network throughput tool
- Uses Windows-native I/O completion ports for maximum accuracy
- Great for measuring Windows network stack performance
- Lightweight single binary

### 6.4 ctsTraffic (Microsoft — Network Reliability & Performance)

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/microsoft/ctsTraffic |
| **License** | MIT |
| **Language** | C++ |
| **Platforms** | Windows 10+ |
| **What it measures** | Good-put (application-level throughput), connection reliability, data integrity, connection establishment rate |

**Why it's good for Mixiee:**
- Measures "good-put" — what apps actually experience (vs raw throughput)
- Tracks reliability: connection errors, data corruption, protocol errors
- Validates data integrity across connections
- CSV output for analysis
- Great for showing that tuning doesn't sacrifice reliability for speed

### 6.5 LibreSpeed (Self-Hosted Speed Test)

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/librespeed/speedtest |
| **License** | LGPLv3 |
| **Language** | JavaScript (frontend), PHP/Go/Rust (backend) |
| **Platforms** | Any (web-based) |
| **What it measures** | Download speed, upload speed, ping, jitter |

**Why it's good for Mixiee:**
- ⭐ **BEST FOR USER-FACING INTERNET SPEED TESTS** ⭐
- No Flash, no Java — pure JavaScript with XMLHttpRequest and Web Workers
- Self-hostable — Mixiee can run its own speed test servers
- Mobile-friendly
- Telemetry support for storing results
- Result sharing feature
- Multiple Points of Test support

**Integration approach:**
- Host LibreSpeed servers (or use existing infrastructure)
- Embed the speed test UI within Mixiee's interface
- Or use the CLI client (`librespeed/speedtest-cli`) for headless testing
- .NET client library available: `LibreSpeed.NET` (NuGet package)
- Compare download/upload/ping/jitter before and after network tuning

---

## 7. Latency Benchmarking (System / DPC / Input)

### 7.1 PresentMon — Input-to-Display Latency

(See Section 4.3 above for details)

**For latency specifically, PresentMon measures:**
- **CPU Frame Time** — time CPU spends preparing each frame
- **GPU Frame Time** — time GPU spends rendering each frame
- **Display Latency** — total time from CPU start to pixel on screen
- **Input Latency** — time from input event to pixel response
- **Frame Pacing** — consistency of frame delivery (jitter)

### 7.2 Windows Performance Counters / ETW (Event Tracing for Windows)

**Not a single tool, but a Windows platform capability.**

| What to measure | ETW Provider / Counter |
|-----------------|----------------------|
| **DPC Latency** | `Microsoft-Windows-Kernel-Processor-Power`, `DPC` events |
| **ISR Latency** | Interrupt Service Routine timing via ETW |
| **Context Switch** | `Microsoft-Windows-Kernel-Process` |
| **Timer Resolution** | `NtQueryTimerResolution` API |
| **Scheduling Latency** | `Microsoft-Windows-Kernel-Dispatcher` |

**Integration approach:**
- Use Windows ETW APIs to capture DPC/ISR latency data
- This is what LatencyMon (closed source) does internally
- Build your own DPC latency checker using ETW traces
- Show users: "Your DPC latency dropped from 500μs to 80μs after tuning"

**Key Windows APIs:**
```cpp
// Timer resolution
NtQueryTimerResolution(&MinResolution, &MaxResolution, &CurrentResolution);

// CPU performance counters
QueryPerformanceCounter(&counter);
QueryPerformanceFrequency(&frequency);

// ETW Tracing
StartTrace(...);
EnableTraceEx2(...);
```

### 7.3 Custom Latency Benchmarks to Build

For a tuning utility, these custom latency measurements would be extremely valuable:

1. **Timer Resolution Test**
   - Measure current system timer resolution (default 15.6ms vs 0.5ms)
   - Show impact of timer resolution tuning

2. **Thread Scheduling Latency Test**
   - Create a high-priority thread, sleep for 1ms, measure actual wake time
   - Shows impact of CPU affinity, power plan, and scheduler tuning

3. **I/O Completion Latency Test**
   - Perform small I/O operations and measure completion time
   - Shows impact of I/O priority and disk tuning

4. **Memory Latency Test**
   - Random pointer-chasing benchmark
   - Shows impact of NUMA tuning and memory configuration
   - Consider using **tinymembench** (https://github.com/ssvb/tinymembench) — MIT license

---

## 8. Hardware Monitoring & Telemetry

### 8.1 LibreHardwareMonitor

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/LibreHardwareMonitor/LibreHardwareMonitor |
| **License** | MPL 2.0 |
| **Language** | C# (.NET) |
| **Platforms** | Windows |
| **NuGet** | `LibreHardwareMonitorLib` |

**What it monitors:**
- CPU: temperature, load %, clock speed, power consumption, voltage
- GPU: temperature, load %, clock speed, VRAM usage, fan speed, power
- RAM: usage, clock speed
- Storage: temperature, health (S.M.A.R.T.), read/write activity
- Motherboard: voltages, fan speeds
- Network: bandwidth usage

**Why it's critical for Mixiee:**
- ⭐ **ESSENTIAL FOR MONITORING DURING BENCHMARKS** ⭐
- Shows CPU/GPU temperature and throttling during tests
- Verifies that tuning doesn't cause thermal issues
- Can display real-time metrics alongside benchmark scores
- Available as a NuGet library — easy to integrate into .NET apps
- Supports Intel, AMD, NVIDIA hardware

**Integration code sample:**
```csharp
using LibreHardwareMonitor.Hardware;

var computer = new Computer
{
    IsCpuEnabled = true,
    IsGpuEnabled = true,
    IsMemoryEnabled = true,
    IsStorageEnabled = true,
    IsNetworkEnabled = true
};

computer.Open();
computer.Accept(new UpdateVisitor());

foreach (var hardware in computer.Hardware)
{
    foreach (var sensor in hardware.Sensors)
    {
        Console.WriteLine($"{sensor.Name}: {sensor.Value} ({sensor.SensorType})");
    }
}
```

**Integration approach:**
- Run LibreHardwareMonitor in parallel with benchmarks
- Log CPU/GPU temperatures, clocks, and power during each test
- Flag if thermal throttling occurred (invalidates benchmark result)
- Show "system health" metrics alongside performance scores

---

## 9. Cross-Cutting: Phoronix Test Suite (Meta-Framework)

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/phoronix-test-suite/phoronix-test-suite |
| **License** | GPLv3 |
| **Language** | PHP (CLI) |
| **Platforms** | Linux, Windows, macOS, BSD |
| **Test profiles** | 600+ individual tests, 200+ suites |
| **Website** | https://www.openbenchmarking.org/ |

**Why it's good for Mixiee:**
- The most comprehensive benchmarking meta-framework available
- 600+ test profiles covering CPU, GPU, disk, memory, network, and more
- Automated test installation, execution, and result reporting
- Built-in result comparison and sharing via OpenBenchmarking.org
- Can serve as a reference for which tests to implement
- Automates the download and execution of tools like fio, iperf3, etc.

**Integration approach:**
- Don't embed PTS directly (it's PHP-based and heavy)
- Instead, study its test profiles to understand which tools and parameters are most effective
- Use OpenBenchmarking.org results as baseline comparisons
- Consider submitting Mixiee results to OpenBenchmarking.org for community comparison

---

## 10. Comparison Matrix

### CPU Benchmarking Tools

| Tool | License | Windows Native | Resource Usage | Output Format | Accuracy | Recommendation |
|------|---------|---------------|----------------|---------------|----------|---------------|
| sysbench | GPLv2 | Via WSL | Very Low | JSON | High | ✅ Primary (Linux) |
| stress-ng | GPLv2+ | Via WSL | Configurable | Text | High | ✅ Supplementary |
| UnixBench | GPLv2 | No | Moderate | Text | Medium | Optional |
| Google Benchmark | Apache 2.0 | ✅ | Very Low | JSON/CSV | Very High | ✅ Custom tests |

### GPU Benchmarking Tools

| Tool | License | Windows Native | GPU Support | Resource Usage | Recommendation |
|------|---------|---------------|-------------|----------------|---------------|
| vkpeak | MIT | ✅ | All (Vulkan) | Very Low | ⭐ Primary |
| GPUPerfAPI | MIT | ✅ | AMD only | Low | Supplementary (AMD) |
| PresentMon | MIT | ✅ | All | Low | ⭐ Primary (latency) |
| MangoHud | MIT | Linux only | All | Low | Linux only |

### Disk Benchmarking Tools

| Tool | License | Windows Native | Output Format | Accuracy | Recommendation |
|------|---------|---------------|---------------|----------|---------------|
| DiskSpd | MIT | ✅ | XML/Text | Very High | ⭐ Primary (Windows) |
| fio | GPLv2 | Via installer | JSON | Very High | ⭐ Primary (cross-platform) |

### Network Benchmarking Tools

| Tool | License | Windows Native | Features | Recommendation |
|------|---------|---------------|----------|---------------|
| Ethr | MIT | ✅ | All-in-one | ⭐ Primary |
| iperf3 | BSD | Community builds | Bandwidth focus | ✅ Supplementary |
| ntttcp | MIT | ✅ | Throughput only | Optional |
| ctsTraffic | MIT | ✅ | Reliability focus | Optional |
| LibreSpeed | LGPLv3 | Web-based | User-facing | ⭐ Internet speed |

---

## 11. Recommended Implementation Stack

### Phase 1 — MVP (Minimum Viable Product)

Build these first for a solid foundation:

| Category | Primary Tool | Why |
|----------|-------------|-----|
| **CPU** | Custom C++ benchmarks (Google Benchmark lib) + sysbench | Full control + proven standard |
| **GPU** | vkpeak | Cross-vendor, lightweight, MIT license |
| **Disk** | DiskSpd (Windows) / fio (cross-platform) | Industry standards, best accuracy |
| **Network** | Ethr | All-in-one, MIT, native Windows |
| **Latency** | PresentMon (frame/input latency) + custom ETW (DPC/ISR) | Complete latency picture |
| **Monitoring** | LibreHardwareMonitor | Temperature/throttle detection |

### Phase 2 — Enhanced

| Addition | Purpose |
|----------|---------|
| LibreSpeed integration | User-facing internet speed test |
| stress-ng CPU stressors | Targeted CPU feature testing |
| GPUPerfAPI (AMD) / NVAPI (NVIDIA) | Deep GPU hardware counter data |
| ctsTraffic | Network reliability validation |
| Custom DPC latency checker | System latency measurement |
| tinymembench | Memory bandwidth/latency |

### Phase 3 — Competitive Differentiator

| Addition | Purpose |
|----------|---------|
| Automated before/after workflow | One-click "Run tuning + benchmark" |
| Historical tracking & charts | Show performance trends over time |
| Community comparison | Compare scores against other users |
| OpenBenchmarking.org integration | Cross-reference with industry results |
| AI-powered analysis | "Your disk IOPS improved by 40% — here's why" |

---

## 12. Before/After Tuning — Scoring Strategy

### Composite Score Architecture

```
Mixiee Score = (CPU_Score × 0.25) + (GPU_Score × 0.25) + (Disk_Score × 0.20)
             + (Network_Score × 0.15) + (Latency_Score × 0.15)
```

### Individual Scores

**CPU Score (0-100):**
```
Components:
- Single-thread performance (sysbench events/sec, 1 thread) × 0.4
- Multi-thread performance (sysbench events/sec, all threads) × 0.4
- Scheduling latency (custom test) × 0.2

Normalization: Score against a reference machine (e.g., Ryzen 5 5600X = 50)
```

**GPU Score (0-100):**
```
Components:
- FP32 compute (vkpeak fp32-vec4 GFLOPS) × 0.3
- Memory bandwidth (vkpeak copy-d2d GBPS) × 0.2
- Frame time consistency (PresentMon 1% low / avg ratio) × 0.25
- Input latency (PresentMon input latency ms) × 0.25

Normalization: Score against reference (e.g., RTX 3060 = 50)
```

**Disk Score (0-100):**
```
Components:
- Sequential Read MB/s × 0.2
- Sequential Write MB/s × 0.2
- 4K Random Read IOPS × 0.25
- 4K Random Write IOPS × 0.20
- Read latency p99 (inverse) × 0.15

Normalization: Score against reference (e.g., Samsung 970 EVO Plus = 50)
```

**Network Score (0-100):**
```
Components:
- Bandwidth (Ethr TCP throughput) × 0.35
- Connection latency (Ethr TCP connection setup) × 0.25
- Packet throughput (Ethr packets/sec) × 0.20
- Jitter (LibreSpeed or Ethr) × 0.20
```

**Latency Score (0-100):**
```
Components:
- DPC latency average (ETW custom, inverse) × 0.30
- Timer resolution accuracy (custom, inverse) × 0.25
- Thread scheduling latency (custom, inverse) × 0.25
- I/O completion latency (custom, inverse) × 0.20
```

### Before/After Display

```
┌──────────────────────────────────────────┐
│          MIXIEE BENCHMARK RESULTS         │
├──────────────────────────────────────────┤
│  Component    Before    After    Δ        │
│  ─────────    ──────    ─────    ──       │
│  CPU          62        71       +14.5%   │
│  GPU          55        58       +5.5%    │
│  Disk         48        67       +39.6%   │
│  Network      70        74       +5.7%    │
│  Latency      35        78       +122.9%  │
│  ─────────    ──────    ─────    ──       │
│  OVERALL      54        70       +29.6%   │
│                                           │
│  🌡️ Max CPU Temp: 72°C (safe)            │
│  🌡️ Max GPU Temp: 65°C (safe)            │
│  ⚠️ No thermal throttling detected        │
└──────────────────────────────────────────┘
```

---

## 13. Resource Consumption Guidelines

### Design Goals

- **Quick Test:** < 2 minutes total, minimal disk space, < 200MB RAM
- **Standard Test:** < 10 minutes total, < 2GB temporary disk space, < 500MB RAM
- **Thorough Test:** < 30 minutes total, < 5GB temporary disk space, < 1GB RAM

### Per-Component Budget

| Component | Quick (seconds) | Standard (seconds) | Thorough (seconds) |
|-----------|----------------|--------------------|--------------------|
| CPU | 10 | 30 | 120 |
| GPU | 5 | 20 | 60 |
| Disk | 15 | 60 | 300 |
| Network | 10 | 30 | 120 |
| Latency | 5 | 20 | 60 |
| **Total** | **~45 sec** | **~3 min** | **~11 min** |

### Resource Cleanup

- Delete temporary test files after disk benchmarks
- Kill all spawned benchmark processes on completion or cancellation
- Release GPU resources after vkpeak completes
- Close ETW trace sessions

---

## 14. Licensing Summary

| Tool | License | Can embed in commercial app? | Must share source? |
|------|---------|-----------------------------|--------------------|
| vkpeak | MIT | ✅ Yes | No |
| DiskSpd | MIT | ✅ Yes | No |
| Ethr | MIT | ✅ Yes | No |
| PresentMon | MIT | ✅ Yes | No |
| GPUPerfAPI | MIT | ✅ Yes | No |
| ntttcp | MIT | ✅ Yes | No |
| ctsTraffic | MIT | ✅ Yes | No |
| Google Benchmark | Apache 2.0 | ✅ Yes | No |
| LibreHardwareMonitor | MPL 2.0 | ✅ Yes (with conditions) | Modified files only |
| fio | GPLv2 | ⚠️ As separate process only | If linked/modified |
| sysbench | GPLv2 | ⚠️ As separate process only | If linked/modified |
| stress-ng | GPLv2+ | ⚠️ As separate process only | If linked/modified |
| UnixBench | GPLv2 | ⚠️ As separate process only | If linked/modified |
| LibreSpeed | LGPLv3 | ✅ Yes (with conditions) | Modified lib files |
| Phoronix Test Suite | GPLv3 | ❌ Reference only | Yes |

**Key licensing guidance:**
- **MIT / Apache 2.0 tools** can be freely embedded, modified, and distributed
- **GPLv2 tools** (fio, sysbench) should be invoked as **separate processes** (exec/spawn), not linked into your binary — this avoids GPL contamination
- **MPL 2.0** (LibreHardwareMonitor) — you can use it as a library; if you modify its source files, only those modified files must be shared
- **LGPLv3** (LibreSpeed) — can link to it; if you modify the library itself, share those changes

---

## 15. References & Links

### Repositories

| Tool | URL |
|------|-----|
| sysbench | https://github.com/akopytov/sysbench |
| stress-ng | https://github.com/ColinIanKing/stress-ng |
| UnixBench | https://github.com/kdlucas/byte-unixbench |
| Google Benchmark | https://github.com/google/benchmark |
| vkpeak | https://github.com/nihui/vkpeak |
| GPUPerfAPI | https://github.com/GPUOpen-Tools/gpu_performance_api |
| PresentMon | https://github.com/GameTechDev/PresentMon |
| MangoHud | https://github.com/flightlessmango/MangoHud |
| Radeon GPU Profiler | https://github.com/GPUOpen-Tools/radeon_gpu_profiler |
| fio | https://github.com/axboe/fio |
| DiskSpd | https://github.com/microsoft/diskspd |
| iperf3 | https://github.com/esnet/iperf |
| Ethr | https://github.com/microsoft/ethr |
| ntttcp | https://github.com/microsoft/ntttcp |
| ctsTraffic | https://github.com/microsoft/ctsTraffic |
| LibreSpeed | https://github.com/librespeed/speedtest |
| LibreHardwareMonitor | https://github.com/LibreHardwareMonitor/LibreHardwareMonitor |
| tinymembench | https://github.com/ssvb/tinymembench |
| Phoronix Test Suite | https://github.com/phoronix-test-suite/phoronix-test-suite |

### Documentation & Guides

- fio documentation: https://fio.readthedocs.io/
- DiskSpd wiki: https://github.com/microsoft/diskspd/wiki
- iperf3 FAQ: https://software.es.net/iperf/faq.html
- PresentMon usage: https://github.com/GameTechDev/PresentMon/blob/main/README-ConsoleApplication.md
- ETW Tracing guide: https://learn.microsoft.com/en-us/windows/win32/etw/event-tracing-portal
- Vulkan SDK: https://vulkan.lunarg.com/
- OpenBenchmarking.org: https://www.openbenchmarking.org/

---

*This document was prepared for the Mixiee development team. For questions or updates, refer to the repository issues or contact the benchmarking implementation lead.*
