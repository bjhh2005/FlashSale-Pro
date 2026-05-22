import time
import http.client
import json
import sys
import statistics


def measure_entropy_decision_latency(host="localhost", port=9080, user_ids=None, rounds=100):
    if user_ids is None:
        user_ids = [str(i) for i in range(1, 51)]

    latencies = []
    errors = 0

    for _ in range(rounds):
        for uid in user_ids:
            start = time.perf_counter()
            try:
                conn = http.client.HTTPConnection(host, port, timeout=5)
                conn.request("GET", f"/api/flash-sale/order/seckill?itemId=1&quantity=1",
                             headers={"X-User-Id": uid})
                resp = conn.getresponse()
                resp.read()
                elapsed_ms = (time.perf_counter() - start) * 1000
                latencies.append(elapsed_ms)
            except Exception as e:
                errors += 1
            finally:
                try:
                    conn.close()
                except Exception:
                    pass

    if not latencies:
        print("No successful requests - gateway may not be running")
        return

    avg = statistics.mean(latencies)
    p50 = statistics.median(latencies)
    p95 = sorted(latencies)[int(len(latencies) * 0.95)]
    p99 = sorted(latencies)[int(len(latencies) * 0.99)]
    mx = max(latencies)
    mn = min(latencies)

    print(f"\n{'='*60}")
    print(f"NFR1 网关决策延迟专项测试 (含熵计算+Redis查询)")
    print(f"{'='*60}")
    print(f"总请求: {len(latencies)} 成功, {errors} 失败")
    print(f"平均延迟: {avg:.2f}ms")
    print(f"P50: {p50:.2f}ms  P95: {p95:.2f}ms  P99: {p99:.2f}ms")
    print(f"Min: {mn:.2f}ms  Max: {mx:.2f}ms")
    print(f"\nNFR1 验收: 决策延迟 < 5ms? {'PASS' if p95 < 5 else 'FAIL (P95=' + str(round(p95,2)) + 'ms)'}")
    print(f"NFR1 验收: 决策延迟 < 10ms(P99)? {'PASS' if p99 < 10 else 'FAIL (P99=' + str(round(p99,2)) + 'ms)'}")
    print(f"{'='*60}")

    return {"avg": avg, "p50": p50, "p95": p95, "p99": p99, "errors": errors}


def measure_gateway_throughput(host="localhost", port=9080, concurrency=100, duration_sec=10):
    import urllib.request
    import concurrent.futures

    success = 0
    fail = 0
    start = time.time()
    deadline = start + duration_sec

    def single_request():
        nonlocal success, fail
        try:
            req = urllib.request.Request(
                f"http://{host}:{port}/api/flash-sale/order/seckill?itemId=1&quantity=1",
                headers={"X-User-Id": "1"}
            )
            with urllib.request.urlopen(req, timeout=5) as resp:
                resp.read()
                success += 1
        except Exception:
            fail += 1

    with concurrent.futures.ThreadPoolExecutor(max_workers=concurrency) as pool:
        futures = []
        while time.time() < deadline:
            futures.append(pool.submit(single_request))
            time.sleep(0.001)
        concurrent.futures.wait(futures)

    elapsed = time.time() - start
    qps = success / elapsed

    print(f"\n{'='*60}")
    print(f"NFR1 网关吞吐量测试 ({concurrency} 并发, {duration_sec}s)")
    print(f"{'='*60}")
    print(f"成功请求: {success}, 失败: {fail}")
    print(f"实际 QPS: {qps:.0f}")
    print(f"\nNFR1 验收: QPS >= 10,000? {'PASS' if qps >= 10000 else 'FAIL (need higher concurrency or optimization)'}")
    print(f"{'='*60}")

    return {"qps": qps, "success": success, "fail": fail}


if __name__ == "__main__":
    host = sys.argv[1] if len(sys.argv) > 1 else "localhost"
    port = int(sys.argv[2]) if len(sys.argv) > 2 else 9080
    mode = sys.argv[3] if len(sys.argv) > 3 else "latency"

    if mode == "latency":
        measure_entropy_decision_latency(host, port)
    elif mode == "throughput":
        concurrency = int(sys.argv[4]) if len(sys.argv) > 4 else 100
        duration = int(sys.argv[5]) if len(sys.argv) > 5 else 10
        measure_gateway_throughput(host, port, concurrency, duration)
    else:
        print("Usage: python nfr1_benchmark.py [host] [port] [latency|throughput] [concurrency] [duration]")
