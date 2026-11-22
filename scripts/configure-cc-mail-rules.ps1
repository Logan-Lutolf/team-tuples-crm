# Run by the Microsoft 365 email administrator after Connect-ExchangeOnline.
# Keep the proof in a secret store; do not reuse the CRM webhook secret.
param(
    [Parameter(Mandatory = $true)][string]$Mailbox,
    [Parameter(Mandatory = $true)][string]$VerifiedSenderSecret
)
$ErrorActionPreference = 'Stop'
if ($Mailbox -notmatch '^[^\s@]+@[^\s@]+\.[^\s@]+$' -or $VerifiedSenderSecret.Length -lt 32) {
    throw 'Provide a real mailbox and a random proof value of at least 32 characters.'
}

$header = 'X-CRM-Verified-Sender'
$stripRule = 'CRM CC - remove untrusted marker'
$stampRule = 'CRM CC - mark authenticated internal sender'

# Strip any sender-supplied marker before stamping verified messages. Do not reverse this order.
if (Get-TransportRule -Identity $stripRule -ErrorAction SilentlyContinue) {
    Set-TransportRule -Identity $stripRule -SentTo $Mailbox -RemoveHeader $header -Priority 0 -Mode Enforce
} else {
    New-TransportRule -Name $stripRule -SentTo $Mailbox -RemoveHeader $header -Priority 0 -Mode Enforce | Out-Null
}
if (Get-TransportRule -Identity $stampRule -ErrorAction SilentlyContinue) {
    Set-TransportRule -Identity $stampRule -SentTo $Mailbox -FromScope InOrganization -SetHeaderName $header -SetHeaderValue $VerifiedSenderSecret -Priority 1 -Mode Enforce
} else {
    New-TransportRule -Name $stampRule -SentTo $Mailbox -FromScope InOrganization -SetHeaderName $header -SetHeaderValue $VerifiedSenderSecret -Priority 1 -Mode Enforce | Out-Null
}
Enable-TransportRule -Identity $stripRule
Enable-TransportRule -Identity $stampRule
Write-Output 'CRM mail rules configured. Review their order and test internal delivery and an externally forged marker before enabling the scheduler.'
