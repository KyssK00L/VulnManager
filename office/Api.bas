Attribute VB_Name = "Api"
Option Explicit

' VulnManager API Module
' Handles all API communication

' Private function to make HTTP GET requests
Private Function ApiGet(ByVal url As String, ByVal token As String) As String
    On Error GoTo ErrorHandler

    Dim http As Object
    Set http = CreateObject("MSXML2.XMLHTTP")

    ' Open connection
    http.Open "GET", url, False

    ' Set headers
    If Len(token) > 0 Then
        http.setRequestHeader "Authorization", "Bearer " & token
    End If
    http.setRequestHeader "Content-Type", "application/json"

    ' Send request
    http.send

    ' Check status
    If http.Status = 401 Or http.Status = 403 Then
        MsgBox "Token invalide, expiré ou révoqué." & vbCrLf & vbCrLf & _
               "Merci d'enregistrer un nouveau token via Settings.", _
               vbExclamation, "VulnManager"
        ApiGet = ""
        Exit Function
    ElseIf http.Status <> 200 Then
        MsgBox "Erreur API: " & http.Status & " - " & http.statusText, _
               vbExclamation, "VulnManager"
        ApiGet = ""
        Exit Function
    End If

    ' Return response
    ApiGet = http.responseText

    Set http = Nothing
    Exit Function

ErrorHandler:
    MsgBox "Erreur de connexion: " & Err.Description & vbCrLf & vbCrLf & _
           "Vérifiez que l'API est accessible.", _
           vbCritical, "VulnManager"
    ApiGet = ""
End Function

' Get vulnerabilities for cache (bulk endpoint)
Public Function GetBulk(Optional ByVal updatedSince As String = "") As String
    Dim url As String
    Dim token As String

    url = GetApiBase() & "/api/vulns/bulk"
    token = GetVulnToken()

    ' Add updated_since parameter if provided
    If Len(updatedSince) > 0 Then
        url = url & "?updated_since=" & updatedSince
    End If

    GetBulk = ApiGet(url, token)
End Function

' Get vulnerability details for document export (exportdoc endpoint)
Public Function GetCardJson(ByVal vulnId As String) As String
    Dim url As String
    Dim token As String

    url = GetApiBase() & "/api/vulns/" & vulnId & "/exportdoc?format=json"
    token = GetVulnToken()

    GetCardJson = ApiGet(url, token)
End Function

' Validate token (check if it's still valid)
Public Function ValidateToken() As Boolean
    On Error GoTo ErrorHandler

    Dim http As Object
    Dim url As String
    Dim token As String

    url = GetApiBase() & "/api/tokens/validate"
    token = GetVulnToken()

    Set http = CreateObject("MSXML2.XMLHTTP")

    http.Open "HEAD", url, False
    http.setRequestHeader "Authorization", "Bearer " & token
    http.send

    ValidateToken = (http.Status = 204)

    Set http = Nothing
    Exit Function

ErrorHandler:
    ValidateToken = False
End Function
