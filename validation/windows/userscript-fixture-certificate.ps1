# SPDX-License-Identifier: MIT
# Copyright (c) 2026 PiesP

$ErrorActionPreference = 'Stop'
$key = $null
$rsa = $null
$certificate = $null
$parameters = $null
try {
    if ([Environment]::Version.Major -ne 4) { throw 'unsupported-clr' }
    $creation = New-Object System.Security.Cryptography.CngKeyCreationParameters
    $creation.Provider = [System.Security.Cryptography.CngProvider]::MicrosoftSoftwareKeyStorageProvider
    $policy = [System.Security.Cryptography.CngExportPolicies]::AllowExport -bor
        [System.Security.Cryptography.CngExportPolicies]::AllowPlaintextExport
    $creation.ExportPolicy = $policy
    $length = [System.BitConverter]::GetBytes([int]2048)
    $creation.Parameters.Add([System.Security.Cryptography.CngProperty]::new(
        'Length', $length, [System.Security.Cryptography.CngPropertyOptions]::None))
    $key = [System.Security.Cryptography.CngKey]::Create(
        [System.Security.Cryptography.CngAlgorithm]::Rsa, $null, $creation)
    if (!$key.IsEphemeral -or $key.Provider.Provider -ne
        [System.Security.Cryptography.CngProvider]::MicrosoftSoftwareKeyStorageProvider.Provider -or
        ($key.ExportPolicy -band $policy) -ne $policy) { throw 'key-policy-mismatch' }
    $rsa = [System.Security.Cryptography.RSACng]::new($key)
    if ($rsa.KeySize -ne 2048) { throw 'key-size-mismatch' }

    $subject = [System.Security.Cryptography.X509Certificates.X500DistinguishedName]::new(
        'CN=pbs.twimg.com')
    $request = [System.Security.Cryptography.X509Certificates.CertificateRequest]::new(
        $subject, $rsa, [System.Security.Cryptography.HashAlgorithmName]::SHA256,
        [System.Security.Cryptography.RSASignaturePadding]::Pkcs1)
    $san = [System.Security.Cryptography.X509Certificates.SubjectAlternativeNameBuilder]::new()
    $san.AddDnsName('pbs.twimg.com')
    $request.CertificateExtensions.Add($san.Build())
    $request.CertificateExtensions.Add(
        [System.Security.Cryptography.X509Certificates.X509BasicConstraintsExtension]::new(
            $false, $false, 0, $true))
    $usage = [System.Security.Cryptography.X509Certificates.X509KeyUsageFlags]::DigitalSignature -bor
        [System.Security.Cryptography.X509Certificates.X509KeyUsageFlags]::KeyEncipherment
    $request.CertificateExtensions.Add(
        [System.Security.Cryptography.X509Certificates.X509KeyUsageExtension]::new($usage, $true))
    $now = [DateTimeOffset]::UtcNow
    $certificate = $request.CreateSelfSigned($now.AddMinutes(-2), $now.AddMinutes(30))
    if (!$certificate.HasPrivateKey) { throw 'certificate-key-missing' }
    $parameters = $rsa.ExportParameters($true)
    function ConvertTo-Base64Url([byte[]]$bytes) {
        if (!$bytes -or $bytes.Length -eq 0) { throw 'missing-key-component' }
        return [Convert]::ToBase64String($bytes).TrimEnd('=').Replace('+', '-').Replace('/', '_')
    }
    $jwk = @{
        kty = 'RSA'
        n = ConvertTo-Base64Url $parameters.Modulus
        e = ConvertTo-Base64Url $parameters.Exponent
        d = ConvertTo-Base64Url $parameters.D
        p = ConvertTo-Base64Url $parameters.P
        q = ConvertTo-Base64Url $parameters.Q
        dp = ConvertTo-Base64Url $parameters.DP
        dq = ConvertTo-Base64Url $parameters.DQ
        qi = ConvertTo-Base64Url $parameters.InverseQ
    }
    $publicDer = $certificate.Export(
        [System.Security.Cryptography.X509Certificates.X509ContentType]::Cert)
    $output = @{ certDerBase64 = [Convert]::ToBase64String($publicDer); jwk = $jwk }
    [Console]::Out.WriteLine(($output | ConvertTo-Json -Compress -Depth 4))
} catch {
    [Console]::Error.WriteLine('fixture-certificate-unavailable')
    exit 1
} finally {
    if ($parameters) {
        foreach ($part in @($parameters.Modulus, $parameters.Exponent, $parameters.D,
            $parameters.P, $parameters.Q, $parameters.DP, $parameters.DQ,
            $parameters.InverseQ)) {
            if ($part) { [Array]::Clear($part, 0, $part.Length) }
        }
    }
    if ($certificate) { $certificate.Dispose() }
    if ($rsa) { $rsa.Dispose() }
    if ($key) { $key.Dispose() }
}
