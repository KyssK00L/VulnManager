Attribute VB_Name = "Settings"
Option Explicit

' VulnManager Settings Module
' Manages API configuration and token storage

' Get API base URL from document variables
Public Function GetApiBase() As String
    On Error Resume Next
    GetApiBase = ActiveDocument.Variables("VulnManager_ApiBase").Value
    If Err.Number <> 0 Then
        GetApiBase = "http://localhost:8000"
    End If
    On Error GoTo 0
End Function

' Set API base URL in document variables
Public Sub SetApiBase(ByVal url As String)
    On Error Resume Next
    ActiveDocument.Variables("VulnManager_ApiBase").Delete
    On Error GoTo 0
    ActiveDocument.Variables.Add Name:="VulnManager_ApiBase", Value:=url
    ActiveDocument.Save
End Sub

' Get API token from document variables
Public Function GetVulnToken() As String
    On Error Resume Next
    GetVulnToken = ActiveDocument.Variables("VulnManager_Token").Value
    If Err.Number <> 0 Then
        GetVulnToken = ""
    End If
    On Error GoTo 0
End Function

' Set API token in document variables
Public Sub SetVulnToken(ByVal token As String)
    On Error Resume Next
    ActiveDocument.Variables("VulnManager_Token").Delete
    On Error GoTo 0
    ActiveDocument.Variables.Add Name:="VulnManager_Token", Value:=token
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
    If Len(apiBase) = 0 Then Exit Sub

    token = InputBox("Enter API Token (from admin):", "VulnManager Settings", token)
    If Len(token) = 0 Then Exit Sub

    ' Save settings
    SetApiBase apiBase
    SetVulnToken token

    MsgBox "Settings saved successfully!", vbInformation
End Sub
