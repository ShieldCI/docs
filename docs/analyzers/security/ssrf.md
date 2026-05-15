---
title: Server-Side Request Forgery (SSRF) Analyzer
description: Detects SSRF vulnerabilities where user input controls outbound HTTP request destinations, enabling access to internal services and cloud metadata
icon: globe
outline: [2, 3]
tags: ssrf,server-side-request-forgery,security,http
pro: true
---

# Server-Side Request Forgery (SSRF) Analyzer

| Analyzer ID | Category     | Severity   | Time To Fix  |
| ----------- | :----------: |:----------:| ------------:|
| `ssrf`      | 🛡️ Security  | Critical   | 30 minutes   |

## What This Checks

Detects Server-Side Request Forgery (SSRF) vulnerabilities where user input controls the destination of outbound HTTP requests. Checks for:

- **Laravel HTTP facade** — `Http::get()`, `Http::post()`, `Http::put()`, `Http::patch()`, `Http::delete()`, `Http::head()` called with a user-controlled URL
- **Guzzle client methods (URL is first arg)** — `get()`, `post()`, `put()`, `patch()`, `delete()`, `head()`, `options()`, and async variants (`getAsync()`, `postAsync()`, `putAsync()`, `patchAsync()`, `deleteAsync()`, `headAsync()`, `optionsAsync()`) with a user-controlled URL
- **Guzzle client methods (URL is second arg)** — `request()`, `requestAsync()` with a user-controlled URL in the second argument
- **PHP remote fetch functions** — `file_get_contents()`, `fopen()`, `readfile()`, `get_headers()`, `fsockopen()`, `pfsockopen()`, and `simplexml_load_file()` with user-controlled URLs
- **cURL** — `curl_init($url)`, `curl_setopt($ch, CURLOPT_URL, ...)`, and `curl_setopt_array($ch, [CURLOPT_URL => ...])` with user-controlled URLs
- **XML and SOAP sinks** — `new SoapClient($wsdlUrl)`, `DOMDocument::load()`, and `XMLReader::open()` with user-controlled URLs
- **Hardcoded cloud metadata endpoints** — references to `169.254.169.254`, `169.254.170.2`, `metadata.google.internal`, or `/latest/meta-data/` outside of safe contexts (blocklist arrays, validation comparisons)
- **Variable taint propagation** — user input assigned to a variable (e.g. `$url = request('url')`) and later passed as a request destination

User input is traced from `$_GET`, `$_POST`, `$_REQUEST`, `$_COOKIE`, `request()`, `Request::` facade, and `$request->input()` through concatenation and string interpolation.

## Why It Matters

SSRF is a critical vulnerability that allows attackers to make the server perform HTTP requests to arbitrary destinations, bypassing network-level security controls:

- **Internal Service Access** - Reaching internal APIs, databases, and admin panels that are not exposed to the internet
- **Cloud Metadata Theft** - Accessing cloud provider metadata endpoints (AWS IMDSv1) to steal IAM credentials, tokens, and configuration
- **Network Scanning** - Mapping internal network infrastructure by probing IP ranges and ports
- **Firewall Bypass** - Making requests from within the trusted network perimeter
- **Data Exfiltration** - Sending internal data to external attacker-controlled servers
- **Denial of Service** - Flooding internal services with requests from the application server

The 2019 Capital One breach, which exposed 100 million customer records, was caused by an SSRF vulnerability that allowed access to AWS metadata credentials.

## How to Fix

### Quick Fix (10 minutes)

Validate URLs against a whitelist of allowed domains:

**Before:**
```php
use Illuminate\Support\Facades\Http;

public function fetchUrl(Request $request)
{
    $url = $request->input('url');

    // VULNERABLE: User controls the entire URL
    $response = Http::get($url);

    return response()->json($response->json());
}
```

**After:**
```php
use Illuminate\Support\Facades\Http;

public function fetchUrl(Request $request)
{
    $validated = $request->validate([
        'url' => 'required|url',
    ]);

    $url = $validated['url'];

    // SAFE: Validate URL against whitelist of allowed domains
    $allowedDomains = ['api.github.com', 'api.stripe.com', 'api.example.com'];
    $host = parse_url($url, PHP_URL_HOST);

    if (!in_array($host, $allowedDomains, true)) {
        abort(403, 'Domain not allowed');
    }

    $response = Http::get($url);

    return response()->json($response->json());
}
```

### Proper Fix (30 minutes)

Implement comprehensive URL validation with DNS resolution checks and internal IP blocking:

**Before:**
```php
public function proxy(Request $request)
{
    $url = $request->input('target');

    // VULNERABLE: cURL with user-controlled URL
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    $response = curl_exec($ch);
    curl_close($ch);

    return response($response);
}
```

**After:**
```php
use Illuminate\Support\Facades\Http;

public function proxy(Request $request)
{
    $validated = $request->validate([
        'target' => 'required|url',
    ]);

    $url = $validated['target'];

    // SAFE: Comprehensive URL validation
    if (!$this->isAllowedUrl($url)) {
        abort(403, 'URL not allowed');
    }

    $response = Http::timeout(10)
        ->maxRedirects(0) // Prevent redirect-based SSRF bypass
        ->get($url);

    return response($response->body(), $response->status());
}

private function isAllowedUrl(string $url): bool
{
    $parsed = parse_url($url);

    // Only allow HTTPS
    if (($parsed['scheme'] ?? '') !== 'https') {
        return false;
    }

    $host = $parsed['host'] ?? '';

    // Block metadata endpoints
    $blocked = ['169.254.169.254', '169.254.170.2', 'metadata.google.internal'];
    if (in_array($host, $blocked, true)) {
        return false;
    }

    // Resolve DNS and block internal IPs
    $ip = gethostbyname($host);
    if ($this->isInternalIp($ip)) {
        return false;
    }

    // Whitelist allowed domains
    $allowedDomains = config('services.allowed_proxy_domains', []);
    return in_array($host, $allowedDomains, true);
}

private function isInternalIp(string $ip): bool
{
    return !filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE);
}
```

**Best Practice: Use a dedicated proxy service pattern:**

```php
// app/Services/SafeHttpClient.php
class SafeHttpClient
{
    private array $allowedDomains;

    public function __construct()
    {
        $this->allowedDomains = config('services.proxy.allowed_domains', []);
    }

    public function get(string $url): \Illuminate\Http\Client\Response
    {
        $this->validateUrl($url);

        return Http::timeout(10)
            ->maxRedirects(0)
            ->withOptions([
                'allow_redirects' => false,
            ])
            ->get($url);
    }

    private function validateUrl(string $url): void
    {
        $parsed = parse_url($url);

        if (!in_array($parsed['scheme'] ?? '', ['http', 'https'], true)) {
            throw new \InvalidArgumentException('Only HTTP(S) URLs are allowed');
        }

        $host = $parsed['host'] ?? '';

        if (!in_array($host, $this->allowedDomains, true)) {
            throw new \InvalidArgumentException("Domain '{$host}' is not in the allowed list");
        }

        // Double-check resolved IP is not internal
        $ip = gethostbyname($host);
        if (!filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE | FILTER_FLAG_NO_RES_RANGE)) {
            throw new \InvalidArgumentException('URL resolves to a private/reserved IP address');
        }
    }
}
```

```php
// Usage in controller
public function fetchExternalData(Request $request, SafeHttpClient $client)
{
    $validated = $request->validate([
        'url' => 'required|url',
    ]);

    $response = $client->get($validated['url']);

    return response()->json($response->json());
}
```


## References

- [OWASP Server-Side Request Forgery](https://owasp.org/www-community/attacks/Server_Side_Request_Forgery)
- [OWASP SSRF Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Server_Side_Request_Forgery_Prevention_Cheat_Sheet.html)
- [CWE-918: Server-Side Request Forgery](https://cwe.mitre.org/data/definitions/918.html)
- [AWS IMDSv2 Documentation](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/configuring-instance-metadata-service.html)
- [Laravel HTTP Client Documentation](https://laravel.com/docs/http-client)
- [OWASP Top 10 2021 - SSRF](https://owasp.org/Top10/A10_2021-Server-Side_Request_Forgery_%28SSRF%29/)

## Related Analyzers

- [Command Injection Analyzer](/analyzers/security/command-injection) - Detects shell command injection vulnerabilities
- [RCE Analyzer](/analyzers/security/rce) - Detects remote code execution vulnerabilities
- [Arbitrary File Upload Analyzer](/analyzers/security/arbitrary-file-upload) - Detects unsafe file upload handling
- [XSS Vulnerabilities Analyzer](/analyzers/security/xss-vulnerabilities) - Detects cross-site scripting vulnerabilities

---
