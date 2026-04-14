# Mixiee Benchmarking Implementation Guide

## Developer Reference Document — Open-Source Benchmarking Tools & Architecture

**Version:** 2.0 (Expanded Deep Research Edition)
**Date:** April 2026
**Purpose:** Comprehensive technical reference for implementing an integrated benchmarking suite into the Mixiee tuning utility. This document covers 31 open-source tools, libraries, APIs, integration strategies, and architectural recommendations for building one of the most accurate and reliable benchmarking experiences — while keeping resource consumption minimal.

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Architecture Overview](#2-architecture-overview)
3. [CPU Benchmarking](#3-cpu-benchmarking)
4. [Memory Bandwidth & Latency Benchmarking](#4-memory-bandwidth--latency-benchmarking)
5. [GPU Benchmarking](#5-gpu-benchmarking)
6. [Disk / Storage Benchmarking](#6-disk--storage-benchmarking)
7. [Network Benchmarking](#7-network-benchmarking)
8. [System Latency Benchmarking (DPC / ISR / Scheduling)](#8-system-latency-benchmarking-dpc--isr--scheduling)
9. [Hardware Monitoring & Telemetry](#9-hardware-monitoring--telemetry)
10. [Cross-Cutting Meta-Frameworks](#10-cross-cutting-meta-frameworks)
11. [Full Tool Comparison Matrix](#11-full-tool-comparison-matrix)
12. [Recommended Implementation Stack](#12-recommended-implementation-stack)
13. [Before/After Tuning — Scoring Strategy](#13-beforeafter-tuning--scoring-strategy)
14. [Resource Consumption Guidelines](#14-resource-consumption-guidelines)
15. [Licensing Summary](#15-licensing-summary)
16. [References & Links](#16-references--links)

---

## 1. Executive Summary

Mixiee aims to become a top-tier benchmarking app alongside its existing system-tuning capabilities. The goal is to accurately measure hardware performance across **CPU, GPU, Memory, Disk, Network, and System Latency** — so users can see the real impact of tuning tweaks on their devices.

This guide catalogs **31 open-source benchmarking tools** across 6 categories, evaluates their accuracy, resource usage, platform support, and license compatibility, and provides a clear integration roadmap.

### Key Design Principles

- **Accuracy First:** Use tools trusted by the industry — fio, DiskSpd, iperf3, vkpeak, Intel PCM, lmbench, STREAM, PresentMon
- **Low Resource Consumption:** Benchmarks run in minutes, configurable depth, clean up automatically
- **Before/After Comparison:** Every benchmark produces a numeric score comparable pre- and post-tuning
- **Windows-First:** Primary target is Windows 10/11 (Linux as secondary)
- **Open Source:** All core tools are open-source with permissive or compatible licenses
- **Modular:** Each benchmark category is an independent module — run solo or as a full suite
- **Vendor-Neutral:** Use Vulkan and cross-vendor tools wherever possible

### What Is New In Version 2.0

Added 12 new tools not in v1.0:
- **Intel PCM** — CPU hardware counters (IPC, cache miss rates, per-channel memory BW, power)
- **STREAM** — The de-facto standard memory bandwidth benchmark (Triad)
- **lmbench** — System micro-latency suite (cache levels, context switch, pipe latency)
- **tinymembench** — Peak memory bandwidth + random access latency
- **Microsoft Latte** — Nanosecond TCP/UDP latency on Windows
- **BenchmarkDotNet** — .NET benchmarking framework (used by .NET Runtime team)
- **Network-Performance-Visualization** — Before/after network comparison in Excel
- **System Informer** — Windows kernel driver/DPC/ISR monitoring
- **glmark2** — OpenGL rendering benchmark (Linux)
- **OpenSSL speed** — Cryptographic CPU throughput (AES-NI, SHA-NI)
- **Intel ISA-L** — Storage acceleration benchmarks
- **ctsTraffic** — Network reliability and data integrity validation

Added new deep technical sections:
- PresentMon SDK architecture and integration guide
- ETW/DPC latency implementation with code samples
- Windows timer resolution API
- Thread scheduling latency custom test
- STREAM license analysis and safe workaround
- Detailed DiskSpd XML output structure
- Ethr vs iperf3 vs Latte tool selection guide

---

## 2. Architecture Overview

```
+----------------------------------------------------------------------+
|                        MIXIEE APP (Frontend)                          |
|              Next.js / Electron / Tauri / WinUI 3 UI                 |
+----------------------------------------------------------------------+
|                  BENCHMARK ORCHESTRATOR (.NET / Rust)                 |
|     (Process spawner, scheduler, result aggregator, JSON parser)      |
+----------+----------+----------+----------+----------+---------------+
|   CPU    |   MEM    |   GPU    |   DISK   |   NET    |   LATENCY     |
|  Module  |  Module  |  Module  |  Module  |  Module  |   Module      |
+----------+----------+----------+----------+----------+---------------+
|                     HARDWARE MONITORING LAYER                         |
|        LibreHardwareMonitor / Intel PCM / System Informer APIs        |
+----------------------------------------------------------------------+
|                         RESULTS ENGINE                                |
|    Scoring, normalization, history, before/after diff, JSON export    |
+----------------------------------------------------------------------+
```

### Recommended Technology Stack

| Layer | Recommendation | Why |
|-------|---------------|-----|
| App Framework | Tauri (Rust + WebView) or Electron | Cross-platform, easy subprocess spawning |
| Backend Language | C# (.NET 8) or Rust | Easy process spawning, JSON parsing, NuGet ecosystem |
| Benchmark Orchestration | Process.Start() / Command::new() | Simple, zero IPC overhead |
| Result Storage | SQLite | Lightweight, embedded, perfect for local history |
| UI Charts | Chart.js, Recharts, or ECharts | Web-based, beautiful, zero license issues |
| Hardware Monitoring | LibreHardwareMonitorLib (NuGet) | Most complete Windows sensor library |

---

## 3. CPU Benchmarking

### 3.1 sysbench — Integer Throughput (Recommended Primary)

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/akopytov/sysbench |
| **License** | GPLv2 |
| **Language** | C + LuaJIT |
| **Platforms** | Linux, macOS, Windows (native binary in releases) |
| **Stars** | 6,000+ |

**What it measures:** Prime number computation throughput. Industry-standard CPU integer benchmark.

**Key commands:**
```
sysbench cpu --cpu-max-prime=20000 --threads=1 --time=10 run    # single-core
sysbench cpu --cpu-max-prime=20000 --threads=N --time=10 run    # multi-core
```

**Output metrics:**
- `events per second` — primary throughput figure
- `avg/min/max/p95/p99 latency (ms)` — consistency measurement
- `total time`, `total events`

**Why it is ideal for Mixiee:**
- No disk or network interaction — pure CPU-bound
- Can run as short as 5 seconds for a quick test
- Built-in latency percentiles (p95/p99) excellent for before/after comparison
- Output is easily parseable structured text
- Configurable prime ceiling to adjust difficulty and test duration

---

### 3.2 stress-ng — Targeted CPU Feature Stressors

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/ColinIanKing/stress-ng |
| **License** | GPLv2+ |
| **Language** | C |
| **Platforms** | Linux, macOS, BSD, Windows (WSL), Android — 370+ stressor types |
| **Stars** | 3,000+ |

**Key CPU stressors for tuning validation:**

| Stressor | What it represents |
|----------|-------------------|
| `matrixprod` | Dense matrix multiply — gaming, ML |
| `fft` | Fast Fourier Transform — audio/DSP processing |
| `sha256` | Cryptographic hashing |
| `aes` | AES encryption (tests AES-NI instruction use) |
| `euler` | Scientific numerical computation |
| `int32` | Integer ALU throughput |
| `float128` | FPU utilization |
| `cache-thrash` | Cache hierarchy stress |

**Key command:** `stress-ng --cpu 4 --cpu-method matrixprod --metrics-brief --timeout 15s`

**Why it is valuable for Mixiee:**
- Match stressor to the user's tuning target — power plan changes, show `matrixprod` before/after
- CPU affinity changes — compare `euler` results
- 100% CPU-targeted with zero disk/network activity

---

### 3.3 BenchmarkDotNet — If Mixiee Is Built with .NET

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/dotnet/BenchmarkDotNet |
| **License** | MIT |
| **Language** | C# |
| **Platforms** | Windows, Linux, macOS |
| **NuGet** | BenchmarkDotNet |
| **Stars** | 11,000+ |
| **Users** | .NET Runtime, Roslyn, ASP.NET Core, 27,400+ GitHub projects |

**Why it is the gold standard for .NET benchmarking:**
- Statistical engine using perfolizer — confidence intervals, outlier detection, p-values
- Automatically detects JIT warm-up issues and warns the developer
- Supports multiple runtimes in one run: .NET 8, .NET Framework, Mono, NativeAOT
- Nanosecond-precision timing
- Memory allocation tracking — managed heap allocations, GC pressure
- Hardware counters via ETW — CPU cycles, cache misses, branch mispredicts
- Exports JSON, CSV, HTML, Markdown

**Sample output:**
```
| Method | N     | Mean       | Error     | StdDev    | Ratio |
|------- |------ |-----------:|----------:|----------:|------:|
| SHA256 | 1000  |   7.735 us | 0.191 us  | 0.403 us  |  1.00 |
| MD5    | 1000  |   2.872 us | 0.055 us  | 0.074 us  |  0.37 |
```

---

### 3.4 Google Benchmark — C++ Custom Benchmarks

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/google/benchmark |
| **License** | Apache 2.0 |
| **Language** | C++ (requires C++17) |
| **Platforms** | Windows, Linux, macOS |
| **Stars** | 9,000+ |
| **Output** | --benchmark_format=json — nanosecond precision |

**Use case for Mixiee:** Build Mixiee-branded custom C++ workloads (sorting, compression, hash tables, encryption, vector math) that directly represent what users care about. Apache 2.0 license means full commercial freedom.

**Key features:**
- BENCHMARK_RANGE(fn, lo, hi) — automatically sweeps parameter ranges
- state.SetBytesProcessed() — auto-calculates MB/s from time
- ThreadRange(1, N) — multi-threaded benchmarking built-in
- CPU frequency scaling detection — warns if throttling during benchmark

---

### 3.5 OpenSSL Speed — Cryptographic CPU Throughput

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/openssl/openssl |
| **License** | Apache 2.0 |
| **Language** | C (with platform assembly for AES-NI, SHA-NI, AVX2/512) |
| **Platforms** | All (Windows via slproweb.com or Chocolatey) |
| **Stars** | 26,000+ |

**Why it matters for Mixiee:**
- Directly tests CPU hardware acceleration: AES-NI, SHA-NI, CLMUL, AVX2/512 instructions
- Power plan and CPU frequency changes dramatically affect crypto throughput
- Results in MB/s for symmetric ciphers — easy to understand
- Validates that enabling hardware instruction sets actually works

**Key command:**
```
openssl speed aes-128-cbc aes-256-gcm sha256 sha512 rsa2048 -seconds 10
```

**Sample output:**
```
aes-128-cbc    16384 bytes:  5374.6 MB/s
sha256         16384 bytes:  8942.1 MB/s
rsa2048       sign/s: 8934   verify/s: 271142
```

---

### 3.6 Intel PCM — Intel Processor Performance Counter Monitor

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/intel/pcm |
| **License** | BSD 3-Clause |
| **Language** | C++ |
| **Platforms** | Linux, Windows, macOS, FreeBSD |
| **Stars** | 3,000+ |

**Sub-tools and what they measure:**

| Tool | Measures |
|------|---------|
| `pcm` | IPC, core frequency (actual Turbo), L2/L3 cache hit rates, memory BW, QPI bandwidth |
| `pcm-memory` | Per-DRAM-channel bandwidth and per-DIMM-rank bandwidth |
| `pcm-latency` | L1 cache miss latency, DDR/PMM memory latency |
| `pcm-power` | Package/core/DRAM power, C-state residency, thermal throttle events |
| `pcm-pcie` | PCIe bandwidth per socket |
| `pcm-iio` | PCIe bandwidth per device |
| `pcm-numa` | Local vs remote memory access ratio |
| `pcm-sensor-server` | JSON/Prometheus HTTP endpoint for programmatic integration |

**Why it is a hidden gem for Mixiee:**
- Memory latency changes from RAM timing tuning — visible in pcm-latency
- IPC changes from power plan tuning — visible in pcm
- L3 cache miss rate changes — shows cache-friendliness improvements
- DRAM energy changes from undervolting — shows efficiency gains
- The pcm-sensor-server exposes all metrics as JSON over HTTP for direct API polling

**Integration example:**
```
pcm-sensor-server -port 9738
curl http://localhost:9738/api/persecond/json
```

---

### 3.7 lmbench — System Micro-Latency Suite

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/intel/lmbench |
| **License** | GPLv2 |
| **Language** | C |
| **Platforms** | Linux, Unix (Intel-maintained fork) |
| **Paper** | McVoy and Staelin, USENIX 1996 — seminal systems benchmarking paper |

**Most valuable sub-benchmarks:**

| Tool | Measures | Tuning relevance |
|------|---------|-----------------|
| `lat_mem_rd` | Memory latency at each working set size (maps all cache levels) | Shows RAM CL timing improvement |
| `bw_mem` | Memory bandwidth (read, write, copy, bcopy) | Baseline memory BW |
| `lat_ctx` | Context switch time for N processes | Scheduler tuning impact |
| `lat_proc` | Fork/exec/shell process creation latency | Memory and scheduler efficiency |
| `lat_pipe` | Pipe IPC latency | IPC performance |
| `lat_unix` | Unix domain socket latency | Local socket performance |
| `lat_cache` | L1/L2/L3/TLB cache latency at each level | Cache hierarchy characterization |

**Sample lat_mem_rd output (reveals full memory hierarchy):**
```
stride=16
0.25000 MB -> 1.609 ns   (L1 cache)
1.00000 MB -> 4.021 ns   (L2 cache boundary)
4.00000 MB -> 11.834 ns  (L3 cache boundary)
32.0000 MB -> 35.211 ns  (LLC boundary)
256.000 MB -> 87.432 ns  (RAM latency)
```

This single output shows exactly how L1/L2/L3/RAM latency changes after RAM timing tuning.

---

## 4. Memory Bandwidth & Latency Benchmarking

### 4.1 STREAM — The Industry Standard Memory Bandwidth Benchmark

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/jeffhammond/STREAM |
| **License** | Custom — free non-commercial, restricted commercial redistribution |
| **Language** | C (and Fortran) |
| **Canonical site** | http://www.cs.virginia.edu/stream/ |
| **Author** | Dr. John D. McCalpin — "Dr. Bandwidth" at IBM |

**The 4 STREAM tests (all operate on arrays larger than L3 cache):**

| Test | Operation | Description |
|------|-----------|-------------|
| Copy | a[i] = b[i] | Measures read + write bandwidth |
| Scale | a[i] = q * b[i] | Read + scalar multiply + write |
| Add | a[i] = b[i] + c[i] | Two reads + one write |
| Triad | a[i] = b[i] + q * c[i] | Most representative — used as "the number" |

**Sample output:**
```
Function     Best Rate MB/s   Avg time     Min time     Max time
Copy:              52847.3   0.006079     0.006056     0.006126
Scale:             52163.5   0.006148     0.006133     0.006158
Add:               58124.1   0.008265     0.008260     0.008272
Triad:             57989.2   0.008286     0.008279     0.008305
```

**Why it is essential for Mixiee:**
- The Triad result is the single most-cited memory bandwidth figure in the industry — comparable to every CPU/RAM review ever published
- Before/after XMP/EXPO profile changes or RAM frequency tuning: direct, reproducible impact
- Compile with OpenMP for multi-threaded test
- One tiny C file — compiles in under a second

**STREAM license safe workaround:** The license prohibits commercial redistribution of compiled binaries. Safe options:
1. Ship the source (one stream.c file) and compile it at first run
2. Implement the same 4 operations natively in Mixiee — the mathematical concept is not copyrightable

---

### 4.2 tinymembench — Peak Memory Bandwidth + Random Latency

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/ssvb/tinymembench |
| **License** | MIT |
| **Language** | C + hand-optimized assembly (SSE2, NEON) |
| **Platforms** | Linux, Windows (MinGW), Android |

**Sample output:**
```
C copy backwards                         :   9534.4 MB/s
SSE2 copy                                :  24388.9 MB/s
SSE2 streaming copy                      :  24501.1 MB/s
SSE2 streaming write                     :  14582.2 MB/s
random read (pointer chasing)            :    148.7 MB/s (107.6 ns)
```

**Why it complements STREAM:**
- STREAM measures sustained bandwidth; tinymembench shows peak bandwidth achievable with SSE2 optimized code
- The random read result gives memory latency in nanoseconds — directly shows impact of RAM CAS latency tuning
- MIT license — embed freely
- Tiny binary (~50KB) — trivial to bundle

---
## 5. GPU Benchmarking

### 5.1 vkpeak — Peak Vulkan Compute (Primary Recommendation)

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/nihui/vkpeak |
| **License** | MIT |
| **Language** | C++ + GLSL compute shaders (Vulkan) |
| **Platforms** | Windows, Linux, macOS (MoltenVK), Android |
| **GPU support** | All Vulkan-capable GPUs: Intel, AMD, NVIDIA, Apple |

**Complete list of benchmark scenarios:**

| Scenario | Metric | What it tests |
|----------|--------|--------------|
| fp32-scalar, fp32-vec4 | GFLOPS | Single-precision FP (gaming, general compute) |
| fp16-scalar, fp16-vec4, fp16-matrix | GFLOPS | Half-precision (AI inference, ray tracing) |
| fp64-scalar, fp64-vec4 | GFLOPS | Double-precision (scientific computing) |
| int32/int16/int64-scalar/vec4 | GIOPS | Integer throughput |
| int8-dotprod, int8-matrix | GIOPS | INT8 deep learning inference |
| bf16-dotprod, bf16-matrix | GFLOPS | BFloat16 (modern AI training) |
| fp8-matrix, bf8-matrix | GFLOPS | FP8 (Ada/RDNA3+ next-gen AI) |
| copy-h2h | GBPS | CPU RAM to CPU RAM bandwidth |
| copy-h2d | GBPS | CPU RAM to GPU VRAM (PCIe bandwidth) |
| copy-d2h | GBPS | GPU VRAM to CPU RAM (PCIe bandwidth) |
| copy-d2d | GBPS | GPU VRAM internal bandwidth |

**Real benchmark sample (RTX 5060Ti 16GB):**
```
fp32-vec4    = 17137.46 GFLOPS
fp16-matrix  = 101485.35 GFLOPS
int8-matrix  = 202947.80 GIOPS
copy-d2d     = 190.70 GBPS
copy-h2d     = 17.93 GBPS
```

**Recommended scenarios for Mixiee quick GPU test (5 scenarios, ~15 seconds total):**
- `fp32-vec4` — general gaming/compute score
- `fp16-matrix` — AI/modern rendering acceleration score
- `copy-d2d` — VRAM bandwidth (affected by GPU clock and GDDR speed)
- `copy-h2d` — PCIe bandwidth (affected by PCIe power management settings)
- `int8-matrix` — AI inference score

---

### 5.2 PresentMon — Frame Timing, Input Latency & GPU Telemetry

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/GameTechDev/PresentMon |
| **License** | MIT |
| **Language** | C++ |
| **Platforms** | Windows 10/11 only |
| **GPU support** | All (DirectX 11/12, Vulkan, OpenGL) via ETW |
| **Stars** | 3,000+ |
| **Used by** | AMD OCAT, NVIDIA FrameView, CapFrameX internally |

**PresentMon v2 Architecture:**
1. PresentMon Service — Windows service capturing ETW frame data + hardware telemetry
2. PresentMon SDK — C header PresentMonAPI.h + PresentMonAPI2.dll for programmatic integration
3. PresentMon Console Application — CLI for capture and CSV output
4. PresentMon Capture Application — Reference GUI client

**Per-frame metrics captured:**
- `CPUFrameTime` — time CPU spent preparing the frame (ms)
- `GPUFrameTime` — time GPU spent rendering the frame (ms)
- `DisplayLatency` — total pipeline: CPU start to pixel on screen (ms)
- `InputLatency` — hardware input event to pixel response (ms)
- `PresentMode` — flip type (flip, blit, independent flip, etc.)
- `Dropped` — whether the display compositor dropped this frame

**GPU telemetry (from hardware vendors):**
- GPU utilization %, GPU power (W), GPU temperature (C)
- VRAM usage (MB), GPU clock speed (MHz)
- Render/compute/video engine utilization

**SDK integration (C API):**
```c
// Include the SDK header (distributed with PresentMon Service installer)
#include "PresentMonAPI.h"

PM_STATUS status = pmOpenSession(&session);
status = pmStartTracking(session, processId);

PM_FRAME_DATA frameData = {0};
status = pmGetFrameDataForProcess(session, processId, &frameData, &frameCount);
// frameData[i]: cpuFrameTime, gpuFrameTime, displayLatency, inputLatency...

pmStopTracking(session, processId);
pmCloseSession(session);
```

**Derived metrics for Mixiee scoring:**
- Average FPS = 1000 / mean(FrameTime)
- 1% Low FPS = 1000 / p99(FrameTime) — the gaming smoothness metric everyone cares about
- 0.1% Low FPS = 1000 / p99.9(FrameTime) — worst-case stutter
- Frame time variance (StdDev) — consistency score
- Average input latency (ms) — the #1 impact metric for gamers

---

### 5.3 glmark2 — OpenGL Rendering Benchmark (Linux)

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/glmark2/glmark2 |
| **License** | GPLv3 |
| **Language** | C++ |
| **Platforms** | Linux (X11, Wayland, DRM/KMS), Android |
| **GPU support** | All (OpenGL 2.0 and ES 2.0) |

**Test scenes:** build, texture, shading, bump mapping, effect2d, pulsar, desktop, buffer, ideas, jellyfish, terrain, shadow, refract, conditionals, function, loop.

Each scene tests a different GPU rendering code path. Final score is a composite of FPS across all scenes.

**Use for Mixiee (Linux):** Shows rendering pipeline impact of GPU driver tuning and GPU clock changes. Score is directly comparable across driver versions and across time.

---

### 5.4 GPUPerfAPI + Radeon GPU Profiler — AMD Deep Analysis

| Tool | Repository | License | What it shows |
|------|-----------|---------|--------------|
| GPUPerfAPI | https://github.com/GPUOpen-Tools/gpu_performance_api | MIT | Hardware counters per drawcall: shader utilization, cache hit rates, memory BW |
| Radeon GPU Profiler | https://github.com/GPUOpen-Tools/radeon_gpu_profiler | MIT | GPU thread-level trace, wavefront statistics, synchronization overhead |

**Both are AMD Radeon RDNA only (RX 5000+).** Use as supplementary deep-dive tools for AMD users wanting to validate GPU overclocking and undervolting at the hardware counter level.

---

## 6. Disk / Storage Benchmarking

### 6.1 DiskSpd — Windows Native Disk Benchmark (Primary for Windows)

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/microsoft/diskspd |
| **License** | MIT |
| **Language** | C++ |
| **Platforms** | Windows 8+, Windows Server 2012+ |
| **Binary** | ~200KB single portable exe, no install needed |
| **Output** | Text + XML (-Rxml flag) |
| **Stars** | 2,000+ |

**DiskSpd uses Windows IOCP** — the most efficient Windows I/O model — and direct I/O (-Sh) to bypass file system cache for true disk measurements.

**Unique feature not in fio:** Reports per-logical-processor CPU usage during I/O — shows NVMe driver efficiency improvements from tuning.

**Key test commands:**
```powershell
# Create 2GB test file
diskspd -c2G testfile.dat

# Sequential Read (1MB blocks, no cache, queue depth 4)
diskspd -b1M -d15 -o4 -t1 -Sh -r -W5 -L testfile.dat

# Sequential Write
diskspd -b1M -d15 -o4 -t1 -Sh -w100 -W5 -L testfile.dat

# Random Read 4K (QD32, 4 threads — NVMe-optimal pattern)
diskspd -b4K -d15 -o32 -t4 -Sh -r -W5 -L testfile.dat

# Random Write 4K
diskspd -b4K -d15 -o32 -t4 -Sh -w100 -W5 -L testfile.dat

# Mixed 70% Read / 30% Write (desktop simulation)
diskspd -b4K -d15 -o16 -t4 -Sh -w30 -W5 -L testfile.dat
```

**Parameters quick reference:**
- `-b` = block size | `-d` = duration(s) | `-o` = queue depth per thread | `-t` = threads
- `-Sh` = bypass software + hardware cache | `-r` = random | `-w` = write % | `-W` = warmup seconds | `-L` = measure latency | `-Rxml` = XML output

**XML output key fields:**
```xml
<Iops>152843.24</Iops>
<Throughput>596.26</Throughput>
<Latency>0.208</Latency>
<Percentile Percentile="99">0.789</Percentile>
<Percentile Percentile="99.9">1.234</Percentile>
```

**Per-core CPU usage report (unique to DiskSpd):**
```
CPU |  Usage |  User  |  Kernel |  Idle
  0 |  14.2% |   0.8% |  13.4%  |  85.8%
  1 |   8.7% |   0.3% |   8.4%  |  91.3%
```

---

### 6.2 fio — Flexible I/O Tester (Cross-Platform Gold Standard)

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/axboe/fio |
| **License** | GPLv2 |
| **Language** | C |
| **Author** | Jens Axboe — Linux kernel storage I/O maintainer |
| **Platforms** | Linux, Windows (installer since v3.31), macOS, BSD, Android, Solaris |
| **I/O Engines** | io_uring, libaio, IOCP (windowsaio), mmap, sync, posixaio, 20+ more |
| **Output** | --output-format=json+ — full latency histograms at ns precision |
| **Stars** | 5,000+ |

**fio job file for comprehensive Mixiee disk benchmark:**
```ini
[global]
size=2g
direct=1
ioengine=windowsaio
runtime=15
time_based=1
filename=fio-test.dat

[seq-read]
rw=read
bs=1M
numjobs=1
iodepth=8

[rand-read-4k]
rw=randread
bs=4k
numjobs=4
iodepth=32

[rand-write-4k]
rw=randwrite
bs=4k
numjobs=4
iodepth=32

[mixed-70r-30w]
rw=randrw
rwmixread=70
bs=4k
numjobs=4
iodepth=32
```

**JSON output key structure:**
```json
{
  "jobs": [{
    "read": {
      "iops": 524288,
      "bw": 2097152,
      "lat_ns": {
        "mean": 152000,
        "percentile": {
          "99.000000": 200704,
          "99.900000": 245760
        }
      }
    }
  }]
}
```

**Windows fio:** Available as official installer from GitHub releases since v3.31. Use ioengine=windowsaio on Windows.

---

### 6.3 DiskSpd vs fio — Decision Matrix

| Feature | DiskSpd | fio |
|---------|---------|-----|
| Platform | Windows only | Cross-platform |
| License | MIT (embed freely) | GPLv2 (spawn only) |
| Output format | XML | JSON (easier to parse) |
| CPU per-core usage during I/O | YES (unique) | No |
| Windows I/O engine | IOCP native | IOCP via windowsaio |
| io_uring support | No | Yes (Linux 5.1+) |
| Latency histograms | 9-nines percentiles | ns-precision full histograms |
| Recommendation | Primary on Windows | Primary on Linux; fio on Windows too for JSON |

---

## 7. Network Benchmarking

### 7.1 Ethr — Microsoft All-in-One Network Benchmark (Primary)

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/microsoft/ethr |
| **License** | MIT |
| **Language** | Go |
| **Platforms** | Windows, Linux, macOS (single binary, zero dependencies) |
| **Stars** | 2,000+ |

**Ethr replaces multiple separate tools:**

| Need | Old approach | Ethr command |
|------|-------------|-------------|
| TCP bandwidth | iperf3 | ethr -c SERVER -n 8 |
| UDP bandwidth | iperf3 -u | ethr -c SERVER -p udp -n 4 |
| TCP latency (ping) | psping | ethr -c SERVER -t pi -p tcp |
| TCP connection setup rate | Manual | ethr -c SERVER -t c -n 64 |
| Packets per second | Manual | ethr -c SERVER -p udp -t p |
| ICMP ping | ping.exe | ethr -x TARGET -p icmp -t pi |
| Traceroute + latency | tracert | ethr -x TARGET -p icmp -t mtr |

**Tuning-relevant tests:**
- TCP connection latency — affected by Nagle algorithm, TCP_NODELAY, IRQ affinity
- Packets per second (UDP) — affected by NIC interrupt moderation settings
- TCP bandwidth — affected by RSS, receive buffer size, NIC offload settings

---

### 7.2 Microsoft Latte — Nanosecond Network Latency

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/microsoft/latte |
| **License** | MIT |
| **Language** | C++ |
| **Platforms** | Windows only |
| **Precision** | Nanoseconds — the highest precision of any Windows network tool |

**Why Latte is special for Mixiee:**
- Nanosecond precision — not millisecond like most tools
- Built-in latency histograms: p25, p50, p75, p90, p95, p99, p99.9
- Can test loopback (same machine) — shows Windows TCP stack overhead without a second device
- Directly quantifies impact of: Nagle algorithm tweaks, interrupt coalescing, NIC power management, CPU affinity

**Loopback test commands:**
```powershell
# Window 1 - receiver
latte.exe -a 127.0.0.1:4444 -i 65536 -p tcp

# Window 2 - sender
latte.exe -c -a 127.0.0.1:4444 -i 65536 -p tcp
```

**Sample output:**
```
Protocol        : TCP
Iterations      : 65536
Latency (usec)  p25   p50   p75   p90   p95   p99   p99.9
                  22    24    27    31    35    48    89
```

**Tuning impact example:**
- Before (interrupt coalescing default): p50 = 87us, p99 = 412us
- After (disable coalescing, set affinity): p50 = 24us, p99 = 89us

---

### 7.3 iperf3 — TCP/UDP Bandwidth Standard

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/esnet/iperf |
| **License** | BSD 3-Clause |
| **Language** | C |
| **Platforms** | Linux, macOS, FreeBSD, Windows (community builds at iperf.fr) |
| **Output** | --json flag for machine-readable results |
| **Stars** | 6,000+ |

**Key commands:**
```bash
iperf3 -s                                    # Server
iperf3 -c SERVER -t 15 -P 4 --json          # TCP: 15s, 4 parallel streams
iperf3 -c SERVER -u -b 0 -t 15 --json       # UDP: max bandwidth
iperf3 -c SERVER -t 15 -R --json            # Reverse (download test)
iperf3 -c localhost -t 10 --json            # Loopback (stack efficiency)
```

---

### 7.4 ntttcp — Windows Network Throughput

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/microsoft/ntttcp |
| **License** | MIT |
| **Language** | C++ |
| **Platforms** | Windows only |

Windows-native TCP/UDP throughput test using IOCP. Supports processor-group affinity — important for many-core systems and NUMA analysis. Used by Azure/Hyper-V teams for VM network performance testing.

---

### 7.5 LibreSpeed — Self-Hosted Internet Speed Test

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/librespeed/speedtest |
| **License** | LGPLv3 |
| **Language** | JavaScript frontend, PHP/Go/Rust/Node.js backend |
| **CLI client** | https://github.com/librespeed/speedtest-cli (Go binary) |
| **Stars** | 12,000+ |

**Features:** Download speed, upload speed, ping, jitter. Self-hostable. No Flash/Java. Docker image available. Result telemetry and sharing built-in.

**Integration:** Self-host on Mixiee infrastructure. Use Go CLI for headless testing. Reports: download (Mbps), upload (Mbps), ping (ms), jitter (ms).

---

### 7.6 ctsTraffic — Network Reliability & Data Integrity

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/microsoft/ctsTraffic |
| **License** | MIT |
| **Language** | C++ |
| **Platforms** | Windows 10+ |

**Unique value:** Validates data integrity — every buffer received is verified against a known bit pattern. Catches data corruption from aggressive NIC tuning. Measures good-put (app-visible throughput) vs raw wire speed.

**Mixiee use case:** "Your NIC tuning increased speed by 15% with zero connection errors or data corruption" — a powerful trust statement for users worried about stability.

---

### 7.7 Network-Performance-Visualization — Before/After Reports

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/microsoft/Network-Performance-Visualization |
| **License** | MIT |
| **Language** | PowerShell |
| **Platforms** | Windows (PowerShell 5.1+) |

Takes raw output from ntttcp, Latte, and ctsTraffic and generates Excel charts with side-by-side before/after comparison tables, latency histograms, and throughput quartile charts. The visualization approach is an excellent model for Mixiee's results UI design.

---

## 8. System Latency Benchmarking (DPC / ISR / Scheduling)

### 8.1 Windows ETW — Build Your Own DPC/ISR Latency Checker

ETW (Event Tracing for Windows) is what LatencyMon uses internally. You can build equivalent functionality.

**Key ETW kernel providers for latency:**

| Provider Flag | Captures |
|--------------|---------|
| KernelTraceEventParser.Keywords.Interrupt | ISR timing (which driver, how long) |
| KernelTraceEventParser.Keywords.DPC | DPC timing (which driver, how long) |
| KernelTraceEventParser.Keywords.Dispatcher | Thread ready time, scheduling latency |
| KernelTraceEventParser.Keywords.ContextSwitch | Context switch events |

**Implementation using TraceEvent NuGet package (MIT license):**
```csharp
using (var session = new TraceEventSession("MixieeDPCSession")) {
    session.EnableKernelProvider(
        KernelTraceEventParser.Keywords.Interrupt |
        KernelTraceEventParser.Keywords.DPC |
        KernelTraceEventParser.Keywords.Dispatcher
    );

    session.Source.Kernel.DpcStop += data => {
        RecordDpcLatency(data.ElapsedTimeMSec * 1000); // convert to microseconds
    };

    session.Source.Kernel.ISRStop += data => {
        RecordIsrLatency(data.RoutineName, data.ElapsedTimeMSec * 1000);
    };

    Task.Delay(10000).ContinueWith(_ => session.Stop());
    session.Source.Process();
}
```

**What to report:**
- Average DPC latency (us)
- Maximum DPC latency (us) — the LatencyMon headline number
- Top 5 highest-latency drivers
- ISR max latency and which driver caused it

**Before/after tuning example:**
- Before: avg DPC 890us, max DPC 14,200us (bad driver)
- After (driver update + affinity): avg DPC 72us, max DPC 380us

---

### 8.2 Windows Timer Resolution Test

Timer resolution is one of the most impactful system latency tuning targets:

```csharp
[DllImport("ntdll.dll")]
static extern int NtQueryTimerResolution(
    out int MinimumResolution,
    out int MaximumResolution,
    out int CurrentResolution);  // Values in 100-nanosecond units

NtQueryTimerResolution(out int min, out int max, out int current);
// Default Windows: current = 156001 = 15.6ms
// After tuning: current = 5000 = 0.5ms
// Best possible: current = 1000 = 0.1ms (requires HPET + bcdedit)

// Sleep accuracy test
var sw = Stopwatch.StartNew();
Thread.Sleep(1);
var actual = sw.Elapsed.TotalMilliseconds;
// Power Saver: ~15.6ms  |  After tuning: ~1.0ms  |  Best: ~0.5ms
```

---

### 8.3 Thread Scheduling Latency Test (Custom)

Demonstrates the impact of power plan, CPU affinity, and priority changes:

```csharp
Thread.CurrentThread.Priority = ThreadPriority.Highest;
Process.GetCurrentProcess().PriorityClass = ProcessPriorityClass.RealTime;

var sw = Stopwatch.StartNew();
var overshoots = new List<long>();

for (int i = 0; i < 1000; i++) {
    var target = sw.ElapsedTicks + (Stopwatch.Frequency / 1000); // 1ms target
    while (sw.ElapsedTicks < target) { /* spin wait */ }
    Thread.Sleep(1);
    long overshoot = (sw.ElapsedTicks - target) * 1_000_000 / Stopwatch.Frequency;
    overshoots.Add(overshoot); // microseconds late
}

// Power Saver profile: avg 2500us, p99 15000us
// High Performance + timer res: avg 200us, p99 500us
```

---

### 8.4 System Informer (formerly Process Hacker) — Windows Kernel Monitoring

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/winsiderss/systeminformer |
| **License** | MIT |
| **Language** | C (Windows kernel driver + user-mode) |
| **Platforms** | Windows 10+ (32/64-bit) |
| **Stars** | 10,000+ |

**What it provides:**
- Per-driver DPC and ISR timing breakdown
- Real-time interrupt statistics with driver attribution
- GPU, CPU, disk, network activity at process/thread level
- Kernel-mode thread stack traces
- Named pipe and shared memory API for programmatic access
- Plugin architecture for extending functionality

**For Mixiee:** Read DPC/ISR timing in real-time alongside benchmarks, attributing latency to specific drivers. Show: "Driver X was causing 89% of your DPC latency — after updating, latency dropped by 94%."

---

## 9. Hardware Monitoring & Telemetry

### 9.1 LibreHardwareMonitor — Primary Monitoring Library

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/LibreHardwareMonitor/LibreHardwareMonitor |
| **License** | MPL 2.0 |
| **Language** | C# (.NET) |
| **Platforms** | Windows |
| **NuGet** | LibreHardwareMonitorLib |
| **Stars** | 5,000+ |

**Hardware and sensors available:**

| Hardware | Available Sensors |
|----------|-----------------|
| CPU | Temp per core, package temp, per-core clock, package power (W), core voltage, C-state residency |
| GPU (Intel/AMD/NVIDIA) | GPU temp, hotspot, junction temp, GPU clock, VRAM clock, GPU load %, VRAM usage, fan RPM, GPU power (W) |
| RAM | Frequency, voltage (limited support) |
| Storage | Drive temp, S.M.A.R.T. (read errors, reallocated sectors, total TB written, power-on hours) |
| Motherboard | VRM temps, system temp, fan speeds, voltage rails (12V, 5V, 3.3V) |
| Network | Current and total RX/TX bandwidth |

**Integration code:**
```csharp
var computer = new Computer {
    IsCpuEnabled = true, IsGpuEnabled = true,
    IsMemoryEnabled = true, IsStorageEnabled = true
};
computer.Open();
computer.Accept(new UpdateVisitor());

foreach (var hw in computer.Hardware) {
    hw.Update();
    foreach (var s in hw.Sensors) {
        if (s.SensorType == SensorType.Temperature)
            Console.WriteLine($"{hw.Name} {s.Name}: {s.Value:F1} C");
        if (s.SensorType == SensorType.Power)
            Console.WriteLine($"{hw.Name} {s.Name}: {s.Value:F1} W");
    }
}
```

**Critical use in benchmarking:**
- Detect thermal throttling mid-benchmark and flag result as "thermally limited — not representative"
- Log CPU/GPU temps throughout test — show thermal headroom
- Show GPU power reduction after undervolting alongside performance numbers

---

### 9.2 Intel PCM — For Intel CPU Hardware Counter Monitoring During Benchmarks

(Full details in Section 3.6)

Run `pcm-sensor-server -port 9738` as a background service and poll JSON during benchmark runs to collect IPC, L2/L3 cache miss rates, per-DRAM-channel bandwidth, CPU package and DRAM power in Watts, and thermal headroom.

---

### 9.3 System Informer — Alternative Windows Monitor

(Full details in Section 8.4)

Exposes CPU, GPU, disk, network, memory metrics via shared memory and named pipes. MIT license. Alternative to LibreHardwareMonitor for Windows-specific monitoring with deeper kernel insight.

---

## 10. Cross-Cutting Meta-Frameworks

### 10.1 Phoronix Test Suite — 600+ Test Benchmark Framework

| Attribute | Detail |
|-----------|--------|
| **Repository** | https://github.com/phoronix-test-suite/phoronix-test-suite |
| **License** | GPLv3 |
| **Language** | PHP (CLI) |
| **Platforms** | Linux, Windows, macOS, BSD |
| **Test profiles** | 600+ individual tests, 200+ suites |
| **Result database** | https://www.openbenchmarking.org/ |

**Key test profiles to reference for Mixiee parameters:**

| PTS Profile | Tool it runs | Benchmark type |
|-------------|-------------|----------------|
| compress-7zip | 7-Zip | CPU compression (MIPS) |
| openssl | OpenSSL | CPU crypto (AES/RSA MB/s) |
| sysbench | sysbench | CPU integer/float |
| ramspeed-smp | RAMspeed | Memory bandwidth |
| stream | STREAM | Memory BW (Triad/Copy/Add/Scale) |
| tinymembench | tinymembench | Memory BW + random latency |
| fio | fio | Disk I/O with standard params |
| iperf | iperf3 | Network bandwidth |
| glmark2 | glmark2 | OpenGL rendering score |
| stress-ng | stress-ng | CPU/memory targeted stress |
| lmbench | lmbench | Latency micro-benchmarks |

**How to use PTS for Mixiee without distributing it:**
1. Study profiles: PHP files document exact tool parameters — invaluable for getting industry-standard settings right
2. OpenBenchmarking.org baseline: Use community results to build normalization curves for scoring
3. Result comparison: Allow users to export Mixiee results in PTS-compatible format for community comparison
4. Test discovery: Find niche benchmarks you might not know about (600+ available)

---
## 11. Full Tool Comparison Matrix

### CPU Tools

| Tool | License | Windows Native | Quick Test | JSON Output | Custom Workloads | Recommended Use |
|------|---------|---------------|-----------|------------|-----------------|----------------|
| sysbench | GPLv2 | Binary | 5s | Parseable text | No | Integer throughput |
| stress-ng | GPLv2+ | WSL only | 1s | No | Partial | Targeted workloads |
| BenchmarkDotNet | MIT | Yes | No (slow) | Yes | Yes | .NET custom benchmarks |
| Google Benchmark | Apache 2.0 | Yes | Yes | Yes | Yes | C++ custom benchmarks |
| OpenSSL speed | Apache 2.0 | Yes | 3s | Parseable | No | Crypto throughput |
| Intel PCM | BSD | Yes | Always-on | JSON HTTP | No | Intel hardware counters |
| lmbench | GPLv2 | No (Linux) | No | No | No | Latency micro-suite |
| UnixBench | GPLv2 | No (Linux) | No | No | No | Composite system score |

### Memory Tools

| Tool | License | Windows | Quick Test | What it measures | Recommended |
|------|---------|---------|-----------|-----------------|------------|
| STREAM | Custom | Compile | 5s | Sustained BW (Triad, Copy, Add, Scale) | Primary |
| tinymembench | MIT | MinGW | 10s | Peak BW + random access latency | Primary |
| lmbench lat_mem_rd | GPLv2 | No | 30s | Cache hierarchy latency curve | Linux |
| Intel PCM pcm-memory | BSD | Yes | Always-on | Per-channel BW, NUMA analysis | Intel CPUs |

### GPU Tools

| Tool | License | Windows | GPU Support | Primary Use |
|------|---------|---------|------------|------------|
| vkpeak | MIT | Yes | All (Vulkan) | Compute GFLOPS + VRAM/PCIe BW |
| PresentMon | MIT | Yes | All (DX/VK/GL) | Frame time + input latency + GPU telemetry |
| glmark2 | GPLv3 | No | All (OpenGL) | Rendering score (Linux) |
| GPUPerfAPI | MIT | Yes | AMD only | AMD hardware counters per drawcall |
| Radeon GPU Profiler | MIT | Yes | AMD only | AMD GPU thread-level profiling |

### Disk Tools

| Tool | License | Windows | Output Format | Per-Core CPU Report | Recommended |
|------|---------|---------|--------------|--------------------|-----------| 
| DiskSpd | MIT | Yes (native) | XML | Yes (unique!) | Primary on Windows |
| fio | GPLv2 | Installer | JSON | No | Primary on Linux; also Windows |

### Network Tools

| Tool | License | Windows | Latency Precision | All-in-One | Recommended Use |
|------|---------|---------|------------------|-----------|----------------|
| Ethr | MIT | Yes | Microseconds | Yes | Primary — all network tests |
| Latte | MIT | Yes | Nanoseconds | No (latency only) | Latency specialist |
| iperf3 | BSD | Community | Milliseconds | No | Bandwidth supplementary |
| ntttcp | MIT | Yes | No | No | Windows-native throughput |
| LibreSpeed | LGPLv3 | Web | Milliseconds | Internet only | User-facing internet speed |
| ctsTraffic | MIT | Yes | No | No | Data integrity validation |
| Network-Performance-Visualization | MIT | Yes | — | No | Post-processing and visualization |

### Monitoring Tools

| Tool | License | Windows | CPU | GPU | RAM | Disk | Network | DPC/ISR | Recommended |
|------|---------|---------|-----|-----|-----|------|---------|---------|------------|
| LibreHardwareMonitor | MPL 2.0 | Yes | Yes | Yes | Yes | Yes | Yes | No | Primary |
| Intel PCM | BSD | Yes | Yes (Intel) | No | Yes | No | No | No | Intel deep counters |
| System Informer | MIT | Yes | Yes | Yes | Yes | Yes | Yes | Yes | Alternative + DPC |

---

## 12. Recommended Implementation Stack

### Phase 1 — MVP

| Category | Tool(s) | Key metrics | Test duration |
|----------|---------|------------|--------------|
| CPU Single-Core | sysbench (1 thread) | Events/sec, p95 latency | 10s |
| CPU Multi-Core | sysbench (all threads) | Events/sec, speedup ratio | 10s |
| CPU Crypto | openssl speed (AES + SHA256) | MB/s per cipher | 6s |
| Memory Bandwidth | STREAM Triad | GB/s | 5s |
| Memory Latency | tinymembench random read | nanoseconds | 10s |
| GPU Compute | vkpeak fp32-vec4 | GFLOPS | 5s |
| GPU Memory BW | vkpeak copy-d2d + copy-h2d | GBPS | 5s |
| Disk Sequential | DiskSpd / fio seq read+write | MB/s | 30s |
| Disk Random 4K | DiskSpd / fio rand read+write | IOPS + p99 latency | 30s |
| Network Latency | Latte loopback TCP | us (p50, p99) | 10s |
| System Latency | Custom ETW DPC + timer res test | us | 10s |
| Monitoring | LibreHardwareMonitor | Temp, clock, power | Always-on |
| **Total (Quick mode)** | | | **~2.5 minutes** |

### Phase 2 — Full Suite (Target: 3 months)

| Addition | Why it matters |
|----------|---------------|
| Intel PCM integration | Shows memory channel BW, DRAM latency, IPC changes for Intel CPUs |
| PresentMon frame capture | Frame time, input latency, GPU telemetry — proves gaming impact |
| Ethr network bandwidth | Full NIC throughput with latency measurement |
| LibreSpeed internet test | User-visible ISP speed before/after network tuning |
| stress-ng targeted tests | Validates power plan and scheduler tuning with specific workloads |
| lmbench lat_ctx | Context switch latency — shows scheduler improvements |
| STREAM multi-threaded | OpenMP STREAM for NUMA/memory channel efficiency |

### Phase 3 — Competitive Differentiator (Target: 6+ months)

| Feature | Tools needed |
|---------|-------------|
| GPU frame pipeline visualization | PresentMon SDK + lightweight DirectX/Vulkan test scene |
| AI-generated tuning insights | LLM analysis of before/after benchmark deltas |
| Community score leaderboard | Own API or OpenBenchmarking.org integration |
| Network reliability validation | ctsTraffic + Network-Performance-Visualization |
| Per-driver DPC attribution | ETW + System Informer API |
| AMD GPU deep profiling | GPUPerfAPI + Radeon GPU Profiler |
| Memory sub-timing analysis | STREAM + tinymembench + lmbench combined |
| Automated regression testing | Phoromatic-inspired scheduled benchmarks |

---

## 13. Before/After Tuning — Scoring Strategy

### Composite Score Formula

```
MIXIEE SCORE =
  CPU_Score    * 0.22 +
  Memory_Score * 0.12 +
  GPU_Score    * 0.22 +
  Disk_Score   * 0.18 +
  Network_Score * 0.12 +
  Latency_Score * 0.14
```

### Individual Score Formulas (all normalized to 0-100, reference machine = 50.0)

**CPU Score:**
```
= (sysbench 1-thread eps  / ref_1thread  * 40)
+ (sysbench N-thread eps  / ref_Nthread  * 35)
+ (openssl AES128 MB/s    / ref_aes      * 15)
+ (openssl SHA256 MB/s    / ref_sha      * 10)

Reference: AMD Ryzen 5 5600X at stock = 50.0
```

**Memory Score:**
```
= (STREAM Triad GB/s       / ref_triad   * 50)
+ (100 / tinymembench ns                 * 30)    [inverse: lower latency = higher score]
+ (100 / PCM DRAM latency ns             * 20)    [Intel only, else distribute to others]

Reference: DDR4-3200 CL16 dual-channel = 50.0
```

**GPU Score:**
```
= (vkpeak fp32vec4 GFLOPS  / ref_fp32   * 40)
+ (vkpeak copy-d2d GBPS    / ref_vram   * 25)
+ (vkpeak copy-h2d GBPS    / ref_pcie   * 10)
+ (PresentMon 1% low FPS   / ref_1pct   * 15)    [if available]
+ (100 / PresentMon avg input latency    * 10)    [if available]

Reference: NVIDIA RTX 3060 at stock = 50.0
```

**Disk Score:**
```
= (seq read MB/s    / ref_seqread   * 20)
+ (seq write MB/s   / ref_seqwrite  * 20)
+ (4K read IOPS     / ref_4kread    * 25)
+ (4K write IOPS    / ref_4kwrite   * 20)
+ (100 / p99 latency ms              * 15)

Reference: Samsung 970 EVO Plus NVMe = 50.0
```

**Network Score:**
```
= (Ethr TCP bandwidth Mbps / ref_bw     * 35)
+ (100 / Latte p50 latency us           * 35)
+ (LibreSpeed download Mbps / ref_dl    * 15)
+ (100 / LibreSpeed jitter ms           * 15)
```

**Latency Score:**
```
= (timer resolution accuracy score      * 30)    [15.6ms=0, 0.5ms=100]
+ (100 / thread scheduling p99 us       * 30)
+ (100 / DPC average latency us         * 25)
+ (100 / ISR max latency us             * 15)
```

### Result Display Format

```
+================================================================+
|              MIXIEE — TUNING IMPACT REPORT                      |
+================================================================+
|  Component          Before    After      Delta    Delta %       |
|  CPU (22%)            54.2     61.8       +7.6     +14.0%       |
|  Memory (12%)         48.1     67.3      +19.2     +39.9%       |
|  GPU (22%)            55.0     57.2       +2.2      +4.0%       |
|  Disk (18%)           43.7     71.2      +27.5     +62.9%       |
|  Network (12%)        68.4     73.1       +4.7      +6.9%       |
|  Latency (14%)        32.1     79.4      +47.3    +147.4%       |
|  OVERALL              51.8     67.9      +16.1     +31.1%       |
+================================================================+
|  Key Metric Changes:                                             |
|   Disk IOPS:        45,000 -> 147,000    (+226.7%)              |
|   Timer Resolution:   15.6ms -> 0.5ms    (-96.8%)              |
|   Memory Bandwidth: 38.4 -> 52.1 GB/s   (+35.7%)              |
|   DPC Latency:        890us -> 72us      (-91.9%)              |
|   Network Latency:     87us -> 24us      (-72.4%)              |
+================================================================+
|  Thermals: CPU max 74C  GPU max 67C  (both within safe range)   |
|  No thermal throttling detected during any benchmark             |
|  No data integrity errors (ctsTraffic validation passed)         |
+================================================================+
```

---

## 14. Resource Consumption Guidelines

### Test Mode Budgets

| Mode | Duration | Temp disk | RAM overhead | Notes |
|------|---------|-----------|-------------|-------|
| Quick | ~2.5 min | ~2 GB | < 200 MB | Skip GPU frame capture, internet test |
| Standard | ~8 min | ~5 GB | < 400 MB | All categories, medium duration |
| Thorough | ~25 min | ~10 GB | < 800 MB | Full duration, GPU frame capture |

### Per-Test Duration Table

| Test | Quick | Standard | Thorough |
|------|-------|---------|---------|
| CPU sysbench (2 passes) | 2x10s | 2x30s | 2x60s |
| CPU Crypto (openssl) | 6s | 10s | 20s |
| Memory (STREAM + tinymembench) | 10s | 20s | 40s |
| GPU vkpeak (5 scenarios) | 15s | 30s | 60s |
| GPU PresentMon frame capture | SKIP | 30s | 60s |
| Disk (4 tests) | 4x15s | 4x30s | 4x60s |
| Network Latte loopback | 10s | 20s | 30s |
| Network Ethr bandwidth | SKIP | 15s | 30s |
| Network LibreSpeed | SKIP | 15s | 30s |
| System latency (ETW + timer) | 10s | 20s | 30s |
| **Total** | **~2.5 min** | **~8 min** | **~25 min** |

### Resource Cleanup Rules

1. **Disk tests:** Always delete temp test file after completion. Write to target drive, not system temp.
2. **GPU tests:** vkpeak releases resources automatically. PresentMon Service cleans up with pmCloseSession().
3. **Network tests:** Kill listener process after test. Never leave open sockets.
4. **ETW sessions:** Always call StopTrace() even on error paths — orphaned sessions persist until reboot.
5. **Thermal abort:** If LibreHardwareMonitor detects CPU > 95C or GPU > 90C, abort and mark result as "thermally limited."

---

## 15. Licensing Summary

| Tool | License | Embed in commercial app? | Conditions |
|------|---------|------------------------|------------|
| vkpeak | MIT | YES | None |
| DiskSpd | MIT | YES | None |
| Ethr | MIT | YES | None |
| Microsoft Latte | MIT | YES | None |
| ntttcp | MIT | YES | None |
| ctsTraffic | MIT | YES | None |
| Network-Performance-Visualization | MIT | YES | None |
| PresentMon | MIT | YES | None |
| GPUPerfAPI | MIT | YES | None |
| Radeon GPU Profiler | MIT | YES | None |
| Google Benchmark | Apache 2.0 | YES | Attribution in documentation |
| BenchmarkDotNet | MIT | YES | None |
| Intel PCM | BSD 3-Clause | YES | Attribution |
| tinymembench | MIT | YES | None |
| System Informer | MIT | YES | None |
| Intel ISA-L | BSD | YES | Attribution |
| LibreHardwareMonitor | MPL 2.0 | YES (as library) | Modified source files must be shared |
| LibreSpeed | LGPLv3 | YES (as library) | Modified library files must be shared |
| OpenSSL speed tool | Apache 2.0 | YES | Attribution |
| glmark2 | GPLv3 | SPAWN ONLY | Linking makes your app GPL |
| STREAM | Custom | NO commercial redistribution | Ship source; compile at runtime |
| fio | GPLv2 | SPAWN ONLY | Linking makes your app GPL |
| sysbench | GPLv2 | SPAWN ONLY | Linking makes your app GPL |
| stress-ng | GPLv2+ | SPAWN ONLY | Linking makes your app GPL |
| UnixBench | GPLv2 | SPAWN ONLY | Linking makes your app GPL |
| lmbench | GPLv2 | SPAWN ONLY | Linking makes your app GPL |
| Phoronix Test Suite | GPLv3 | REFERENCE ONLY | For learning and inspiration |

### The Three Practical Rules

**Rule 1 — MIT / Apache 2.0 / BSD tools (15 tools):** Embed, link, modify, and redistribute freely in commercial products with zero open-source obligations beyond attribution.

**Rule 2 — GPLv2/v3 tools (fio, sysbench, stress-ng, lmbench, etc.):** Always invoke via Process.Start() or equivalent subprocess spawning. This has **no GPL contamination** of your host application. The GPL only triggers when you link the library into your code.

**Rule 3 — STREAM:** Ship the single stream.c source file in your app and compile it at first run. The mathematical operations (Copy/Scale/Add/Triad) are not copyrightable — you can also implement them natively in Mixiee itself.

---

## 16. References & Links

### Tool Repositories

| Tool | Repository | Stars |
|------|-----------|-------|
| sysbench | https://github.com/akopytov/sysbench | 6k+ |
| stress-ng | https://github.com/ColinIanKing/stress-ng | 3k+ |
| BenchmarkDotNet | https://github.com/dotnet/BenchmarkDotNet | 11k+ |
| Google Benchmark | https://github.com/google/benchmark | 9k+ |
| UnixBench | https://github.com/kdlucas/byte-unixbench | 1k+ |
| OpenSSL | https://github.com/openssl/openssl | 26k+ |
| Intel PCM | https://github.com/intel/pcm | 3k+ |
| lmbench (Intel fork) | https://github.com/intel/lmbench | — |
| STREAM (Jeff Hammond mirror) | https://github.com/jeffhammond/STREAM | — |
| tinymembench | https://github.com/ssvb/tinymembench | — |
| vkpeak | https://github.com/nihui/vkpeak | 1k+ |
| PresentMon | https://github.com/GameTechDev/PresentMon | 3k+ |
| GPUPerfAPI | https://github.com/GPUOpen-Tools/gpu_performance_api | — |
| Radeon GPU Profiler | https://github.com/GPUOpen-Tools/radeon_gpu_profiler | — |
| glmark2 | https://github.com/glmark2/glmark2 | — |
| fio | https://github.com/axboe/fio | 5k+ |
| DiskSpd | https://github.com/microsoft/diskspd | 2k+ |
| iperf3 | https://github.com/esnet/iperf | 6k+ |
| Ethr | https://github.com/microsoft/ethr | 2k+ |
| Microsoft Latte | https://github.com/microsoft/latte | — |
| ntttcp | https://github.com/microsoft/ntttcp | — |
| ctsTraffic | https://github.com/microsoft/ctsTraffic | — |
| Network-Performance-Visualization | https://github.com/microsoft/Network-Performance-Visualization | — |
| LibreSpeed | https://github.com/librespeed/speedtest | 12k+ |
| LibreSpeed CLI | https://github.com/librespeed/speedtest-cli | — |
| LibreHardwareMonitor | https://github.com/LibreHardwareMonitor/LibreHardwareMonitor | 5k+ |
| System Informer | https://github.com/winsiderss/systeminformer | 10k+ |
| Intel ISA-L | https://github.com/intel/isa-l | 1k+ |
| NVIDIA CUDA Samples | https://github.com/NVIDIA/cuda-samples | 5k+ |
| Phoronix Test Suite | https://github.com/phoronix-test-suite/phoronix-test-suite | 2k+ |

### Key Documentation

| Resource | URL |
|----------|-----|
| fio documentation | https://fio.readthedocs.io/ |
| DiskSpd wiki | https://github.com/microsoft/diskspd/wiki |
| PresentMon Service README | https://github.com/GameTechDev/PresentMon/blob/main/README-Service.md |
| PresentMon Console README | https://github.com/GameTechDev/PresentMon/blob/main/README-ConsoleApplication.md |
| ETW Tracing (MSDN) | https://learn.microsoft.com/en-us/windows/win32/etw/event-tracing-portal |
| TraceEvent NuGet (MIT) | https://www.nuget.org/packages/Microsoft.Diagnostics.Tracing.TraceEvent |
| LibreHardwareMonitorLib NuGet | https://www.nuget.org/packages/LibreHardwareMonitorLib/ |
| Vulkan SDK | https://vulkan.lunarg.com/ |
| OpenBenchmarking.org | https://www.openbenchmarking.org/ |
| STREAM canonical site | http://www.cs.virginia.edu/stream/ |
| Intel PCM documentation | https://github.com/intel/pcm/tree/master/doc |
| GPUOpen tools | https://gpuopen.com/tools/ |
| lmbench research paper (1996) | https://www.usenix.org/publications/library/proceedings/usenix96/full_papers/mcvoy.a/ |
| Microsoft Network Perf Visualization | https://github.com/microsoft/Network-Performance-Visualization |
| NtQueryTimerResolution (MSDN) | https://learn.microsoft.com/en-us/windows/win32/api/winternl/ |

---

*Version 2.0 — Expanded Deep Research Edition — April 2026*
*31 open-source tools evaluated across 6 benchmarking categories.*
*Prepared for the Mixiee development team.*
