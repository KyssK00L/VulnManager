Attribute VB_Name = "Settings"
Option Explicit

' VulnManager Settings Module
' Manages API configuration and token storage

' Normalize API base URL (trim spaces, ensure scheme, remove trailing slash)
Private Function NormalizeApiUrl(ByVal rawUrl As String) As String
    Dim url As String
    Dim schemePos As Long

    url = Trim(rawUrl)

    If Len(url) = 0 Then
        NormalizeApiUrl = ""
        Exit Function
    End If

    schemePos = InStr(url, "://")
    If schemePos = 0 Then
        url = "https://" & url
    End If

    ' Remove trailing slashes while preserving scheme part
    Do While Right$(url, 1) = "/" And Len(url) > schemePos + 3
        url = Left$(url, Len(url) - 1)
    Loop

    NormalizeApiUrl = url
End Function

' Get API base URL from document variables
Public Function GetApiBase() As String
    Dim storedValue As String

    On Error Resume Next
    storedValue = ActiveDocument.Variables("VulnManager_ApiBase").Value
    If Err.Number <> 0 Then
        storedValue = "http://localhost:8000"
    End If
    On Error GoTo 0

    GetApiBase = NormalizeApiUrl(storedValue)
End Function

' Set API base URL in document variables
Public Sub SetApiBase(ByVal url As String)
    Dim normalized As String

    normalized = NormalizeApiUrl(url)
    If Len(normalized) = 0 Then
        MsgBox "L'URL API fournie est vide ou invalide.", vbExclamation, "VulnManager"
        Exit Sub
    End If

    On Error Resume Next
    ActiveDocument.Variables("VulnManager_ApiBase").Delete
    On Error GoTo 0
    ActiveDocument.Variables.Add Name:="VulnManager_ApiBase", Value:=normalized
    ActiveDocument.Save
End Sub

' Get API token from document variables
Public Function GetVulnToken() As String
    Dim token As String

    On Error Resume Next
    token = ActiveDocument.Variables("VulnManager_Token").Value
    If Err.Number <> 0 Then
        token = ""
    End If
    On Error GoTo 0

    GetVulnToken = Trim(token)
End Function

' Set API token in document variables
Public Sub SetVulnToken(ByVal token As String)
    Dim trimmed As String

    trimmed = Trim(token)
    If Len(trimmed) = 0 Then
        MsgBox "Le token API ne peut pas être vide.", vbExclamation, "VulnManager"
        Exit Sub
    End If

    On Error Resume Next
    ActiveDocument.Variables("VulnManager_Token").Delete
    On Error GoTo 0
    ActiveDocument.Variables.Add Name:="VulnManager_Token", Value:=trimmed
    ActiveDocument.Save
End Sub

' Check if settings are configured
Public Function IsConfigured() As Boolean
    IsConfigured = (Len(GetApiBase()) > 0 And Len(GetVulnToken()) > 0)
End Function

' Show settings form
Public Sub ShowSettingsForm()
    Dim apiBase As String
    Dim token As String

    ' Get current settings
    apiBase = GetApiBase()
    token = GetVulnToken()

    ' Show input boxes
    apiBase = InputBox("Enter API Base URL:", "VulnManager Settings", apiBase)
    apiBase = NormalizeApiUrl(apiBase)
    If Len(apiBase) = 0 Then Exit Sub

    token = InputBox("Enter API Token (from admin):", "VulnManager Settings", token)
    token = Trim(token)
    If Len(token) = 0 Then Exit Sub

    ' Save settings
    SetApiBase apiBase
    SetVulnToken token

    MsgBox "Settings saved successfully!", vbInformation
End Sub
