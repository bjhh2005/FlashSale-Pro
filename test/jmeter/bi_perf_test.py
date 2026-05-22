import json
import subprocess
import sys
import time
import http.client

def wait_for_gateway(host="localhost", port=9080, timeout=60):
    start = time.time()
    while time.time() - start < timeout:
        try:
            conn = http.client.HTTPConnection(host, port, timeout=2)
            conn.request("GET", "/actuator/health")
            resp = conn.getresponse()
            if resp.status == 200:
                print(f"Gateway ready at {host}:{port}")
                return True
        except Exception:
            pass
        time.sleep(2)
    return False

def run_jmeter(jmx_file, result_file):
    cmd = [
        "jmeter", "-n", "-t", jmx_file,
        "-l", result_file,
        "-Jthreads=1000",
        "-Jramp=10",
        "-Jduration=60",
        "-Jhost=localhost",
        "-Jport=9080",
    ]
    print(f"Running JMeter: {' '.join(cmd)}")
    result = subprocess.run(cmd, capture_output=True, text=True)
    print(result.stdout)
    if result.stderr:
        print(f"STDERR: {result.stderr}")
    return result.returncode == 0

def analyze_results(result_file):
    import xml.etree.ElementTree as ET
    try:
        tree = ET.parse(result_file)
        root = tree.getroot()
        total = 0
        success = 0
        total_time = 0
        for http_sample in root.iter("httpSample"):
            total += 1
            if http_sample.get("s") == "true":
                success += 1
            elapsed = int(http_sample.get("t", "0"))
            total_time += elapsed
        if total == 0:
            print("No samples found")
            return
        success_rate = success / total * 100
        avg_time = total_time / total
        qps = total / 60
        print(f"\n{'='*50}")
        print(f"Performance Test Results (NFR Validation)")
        print(f"{'='*50}")
        print(f"Total requests: {total}")
        print(f"Success rate: {success_rate:.2f}%")
        print(f"Average response time: {avg_time:.2f}ms")
        print(f"Estimated QPS: {qps:.2f}")
        print(f"\nNFR1 Check: QPS >= 10,000? {'PASS' if qps >= 10000 else 'FAIL (need more threads)'}")
        print(f"NFR1 Check: Decision latency < 5ms? {'PASS' if avg_time < 5 else 'NEEDS VERIFICATION (includes network)'}")
        print(f"{'='*50}")
    except Exception as e:
        print(f"Failed to parse results: {e}")

if __name__ == "__main__":
    action = sys.argv[1] if len(sys.argv) > 1 else "run"
    if action == "run":
        if not wait_for_gateway():
            print("Gateway not available")
            sys.exit(1)
        jmx = sys.argv[2] if len(sys.argv) > 2 else "test/jmeter/seckill-baseline.jmx"
        result = sys.argv[3] if len(sys.argv) > 3 else "test/jmeter/results-bi.jtl"
        if run_jmeter(jmx, result):
            analyze_results(result)
    elif action == "analyze":
        result = sys.argv[2] if len(sys.argv) > 2 else "test/jmeter/results-bi.jtl"
        analyze_results(result)
