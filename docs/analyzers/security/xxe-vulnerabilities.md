---
title: XXE Injection Vulnerabilities Analyzer
description: Detects XML External Entity injection vulnerabilities in XML parsing functions that could allow file disclosure, SSRF, and denial of service attacks
icon: file-code
outline: [2, 3]
tags: xxe,xml,external-entity,injection,security
pro: true
---

# XXE Injection Vulnerabilities Analyzer

| Analyzer ID           | Category     | Severity   | Time To Fix  |
|-----------------------| :----------: |:----------:| ------------:|
| `xxe-vulnerabilities` | 🛡️ Security  | Critical   | 20 minutes   |

## What This Checks

This analyzer detects XML External Entity (XXE) injection vulnerabilities by scanning for unsafe XML parsing patterns in your Laravel application.

**Detected Vulnerable Patterns:**

#### XML Parsing Functions (4)
- `simplexml_load_string()` - Parses XML string without XXE protection
- `simplexml_load_file()` - Parses XML file without XXE protection
- `xml_parse()` - Parses XML data without external entity restrictions
- `xml_parser_create()` - Creates XML parser without safe configuration

#### DOMDocument Usage (2)
- `new DOMDocument()` - Instantiation without disabling external entities
- `DOMDocument::loadXML()` - Loading XML without `LIBXML_NOENT` protection

#### XMLReader Usage (1)
- `new XMLReader()` - Instantiation without `setParserProperty(XMLReader::SUBST_ENTITIES, false)`

::: tip What's NOT Flagged
The analyzer correctly recognizes these as **safe**:
- XML functions called with `LIBXML_NOENT` option
- XML functions called with `LIBXML_NONET` option
- Bitwise OR combinations of safe LIBXML constants: `LIBXML_NOENT | LIBXML_NONET`
:::

## Why It Matters

XXE (XML External Entity) attacks exploit XML parsers that process external entity references, allowing attackers to:

- **Read Local Files** - Access `/etc/passwd`, application config files, database credentials
- **Server-Side Request Forgery (SSRF)** - Make requests to internal services and APIs
- **Denial of Service** - Trigger "Billion Laughs" attack causing memory exhaustion
- **Remote Code Execution** - In some configurations, execute arbitrary code on the server
- **Port Scanning** - Enumerate internal network services through the server
- **Data Exfiltration** - Extract sensitive data through out-of-band channels

XXE is listed in the OWASP Top 10 and is particularly dangerous because XML parsing is often deeply embedded in application logic, making vulnerabilities easy to overlook.

## How to Fix

### Quick Fix (5 minutes)

Add safe LIBXML options to XML parsing functions:

**Before (❌):**
```php
public function parseXml(Request $request)
{
    $xml = $request->getContent();

    // VULNERABLE: No XXE protection
    $doc = simplexml_load_string($xml);

    return response()->json(['data' => $doc]);
}
```

**After (✅):**
```php
public function parseXml(Request $request)
{
    $xml = $request->getContent();

    // SAFE: External entities disabled
    $doc = simplexml_load_string($xml, 'SimpleXMLElement', LIBXML_NOENT | LIBXML_NONET);

    return response()->json(['data' => $doc]);
}
```

### Proper Fix (20 minutes)

**Secure DOMDocument usage:**

**Before (❌):**
```php
public function importXml(Request $request)
{
    $xmlContent = $request->input('xml_data');

    // VULNERABLE: External entities can be exploited
    $doc = new DOMDocument();
    $doc->loadXML($xmlContent);

    $items = $doc->getElementsByTagName('item');
    // Process items...
}
```

**After (✅):**
```php
public function importXml(Request $request)
{
    $xmlContent = $request->input('xml_data');

    // SAFE: External entities disabled
    $doc = new DOMDocument();
    $doc->resolveExternals = false;
    $doc->substituteEntities = false;
    $doc->loadXML($xmlContent, LIBXML_NOENT | LIBXML_NONET);

    $items = $doc->getElementsByTagName('item');
    // Process items...
}
```

**Secure XMLReader usage:**

**Before (❌):**
```php
public function readXml(string $filePath)
{
    // VULNERABLE: Entity substitution enabled by default
    $reader = new XMLReader();
    $reader->open($filePath);

    while ($reader->read()) {
        // Process nodes...
    }
}
```

**After (✅):**
```php
public function readXml(string $filePath)
{
    // SAFE: Entity substitution explicitly disabled
    $reader = new XMLReader();
    $reader->open($filePath);
    $reader->setParserProperty(XMLReader::SUBST_ENTITIES, false);

    while ($reader->read()) {
        // Process nodes...
    }
}
```

**Best Practice: Use JSON Instead of XML (✅✅):**

```php
// Avoid XML entirely when possible
public function importData(Request $request)
{
    $validated = $request->validate([
        'data' => 'required|json',
    ]);

    $data = json_decode($validated['data'], true, 512, JSON_THROW_ON_ERROR);

    // Process data safely - no XXE risk with JSON
}
```


## References

- [OWASP XXE Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/XML_External_Entity_Prevention_Cheat_Sheet.html)
- [CWE-611: Improper Restriction of XML External Entity Reference](https://cwe.mitre.org/data/definitions/611.html)
- [OWASP Top 10 - A05:2021 Security Misconfiguration](https://owasp.org/Top10/A05_2021-Security_Misconfiguration/)
- [PHP LIBXML Constants](https://www.php.net/manual/en/libxml.constants.php)
- [PHP DOMDocument::loadXML](https://www.php.net/manual/en/domdocument.loadxml.php)
- [PHP XMLReader::setParserProperty](https://www.php.net/manual/en/xmlreader.setparserproperty.php)

## Related Analyzers

- [SQL Injection Analyzer](/analyzers/security/sql-injection) - Detects SQL injection vulnerabilities
- [Command Injection Analyzer](/analyzers/security/command-injection) - Detects command injection via shell functions
- [Arbitrary File Upload Analyzer](/analyzers/security/arbitrary-file-upload) - Detects unsafe file upload handling
- [XSS Vulnerabilities Analyzer](/analyzers/security/xss-vulnerabilities) - Detects cross-site scripting

---
