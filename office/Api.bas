Attribute VB_Name = "Api"
Option Explicit

' VulnManager API Module
' Handles all API communication

' Default timeout (milliseconds)
Private Const HTTP_TIMEOUT_CONNECT As Long = 5000
Private Const HTTP_TIMEOUT_SEND As Long = 5000
Private Const HTTP_TIMEOUT_RECEIVE As Long = 15000

' Create an HTTP client compatible with TLS 1.2
Private Function CreateHttpClient() As Object
    Dim client As Object

    On Error Resume Next
    Set client = CreateObject("MSXML2.ServerXMLHTTP.6.0")
    If client Is Nothing Then Set client = CreateObject("MSXML2.ServerXMLHTTP60")
    If client Is Nothing Then Set client = CreateObject("MSXML2.XMLHTTP60")
    If client Is Nothing Then Set client = CreateObject("MSXML2.XMLHTTP")
    If client Is Nothing Then Set client = CreateObject("WinHttp.WinHttpRequest.5.1")
    On Error GoTo 0

    Set CreateHttpClient = client
End Function

' Configure timeout values when supported by the HTTP client
Private Sub ConfigureHttpClient(ByVal http As Object)
    On Error Resume Next
    http.setTimeouts HTTP_TIMEOUT_CONNECT, HTTP_TIMEOUT_SEND, _
                     HTTP_TIMEOUT_RECEIVE, HTTP_TIMEOUT_RECEIVE
    On Error GoTo 0
End Sub

' Apply standard headers to every request
Private Sub ApplyCommonHeaders(ByVal http As Object, ByVal token As String)
    On Error Resume Next
    If Len(token) > 0 Then
        http.setRequestHeader "Authorization", "Bearer " & token
    End If
    http.setRequestHeader "Content-Type", "application/json"
    http.setRequestHeader "Accept", "application/json"
    On Error GoTo 0
End Sub

' Simple URL encoder (RFC 3986 safe characters)
Private Function UrlEncode(ByVal value As String) As String
    Dim i As Long
    Dim ch As String
    Dim codePoint As Integer
    Dim encoded As String

    encoded = ""
    For i = 1 To Len(value)
        ch = Mid$(value, i, 1)
        codePoint = Asc(ch)
        If codePoint < 0 Then codePoint = codePoint + 256

        Select Case codePoint
            Case 48 To 57, 65 To 90, 97 To 122, 45, 95, 46, 126 ' 0-9, A-Z, a-z, - _ . ~
                encoded = encoded & ch
            Case Else
                encoded = encoded & "%" & Right$("0" & Hex$(codePoint), 2)
        End Select
    Next i

    UrlEncode = encoded
End Function

' Ensure settings are configured before hitting the API
Private Function EnsureConfiguration(ByVal token As String) As Boolean
    If Len(token) = 0 Then
        MsgBox "Aucun token API configuré. Merci d'enregistrer un token valide via Settings.", _
               vbExclamation, "VulnManager"
        EnsureConfiguration = False
    Else
        EnsureConfiguration = True
    End If
End Function

' Private function to make HTTP GET requests
Private Function ApiGet(ByVal url As String, ByVal token As String) As String
    On Error GoTo ErrorHandler

    Dim http As Object
    Dim statusCode As Long

    If Not EnsureConfiguration(token) Then
        ApiGet = ""
        Exit Function
    End If

    Set http = CreateHttpClient()
    If http Is Nothing Then
        MsgBox "Impossible d'initialiser un client HTTP compatible. Vérifiez la configuration d'Office.", _
               vbCritical, "VulnManager"
        ApiGet = ""
        Exit Function
    End If

    ConfigureHttpClient http

    ' Open connection
    http.Open "GET", url, False

    ' Set headers
    ApplyCommonHeaders http, token

    ' Send request
    http.send

    ' Check status
    statusCode = http.Status

    If statusCode = 401 Or statusCode = 403 Then
        MsgBox "Token invalide, expiré ou révoqué." & vbCrLf & vbCrLf & _
               "Merci d'enregistrer un nouveau token via Settings.", _
               vbExclamation, "VulnManager"
        ApiGet = ""
        Exit Function
    ElseIf statusCode < 200 Or statusCode >= 300 Then
        MsgBox "Erreur API: " & statusCode & " - " & http.statusText, _
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
        url = url & "?updated_since=" & UrlEncode(updatedSince)
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
    Dim statusCode As Long

    url = GetApiBase() & "/api/tokens/validate"
    token = GetVulnToken()

    If Not EnsureConfiguration(token) Then
        ValidateToken = False
        Exit Function
    End If

    Set http = CreateHttpClient()
    If http Is Nothing Then
        ValidateToken = False
        Exit Function
    End If

    ConfigureHttpClient http

    http.Open "HEAD", url, False
    ApplyCommonHeaders http, token
    http.send

    statusCode = http.Status
    ValidateToken = (statusCode = 204)

    Set http = Nothing
    Exit Function

ErrorHandler:
    ValidateToken = False
End Function
