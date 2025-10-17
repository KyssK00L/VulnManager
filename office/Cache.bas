Attribute VB_Name = "Cache"
Option Explicit

' VulnManager Cache Module
' Manages local vulnerability cache using CustomXMLParts

Private Const CACHE_NAMESPACE As String = "VulnManager/Cache"
Private Const CACHE_MAX_AGE_HOURS As Integer = 24

' Get cache XML part
Private Function GetCachePart() As Object
    On Error Resume Next

    Dim part As Object
    Dim parts As Object

    Set parts = ActiveDocument.CustomXMLParts.SelectByNamespace(CACHE_NAMESPACE)

    If parts.Count > 0 Then
        Set GetCachePart = parts(1)
    Else
        ' Create new cache part
        Set GetCachePart = ActiveDocument.CustomXMLParts.Add( _
            "<cache xmlns=""" & CACHE_NAMESPACE & """ lastSync=""""></cache>")
    End If

    On Error GoTo 0
End Function

' Save vulnerabilities to cache
Public Sub SaveCache(ByVal jsonData As String)
    On Error GoTo ErrorHandler

    Dim part As Object
    Dim lastSync As String

    ' Delete existing cache
    Set part = GetCachePart()
    If Not part Is Nothing Then
        part.Delete
    End If

    ' Create new cache with current timestamp
    lastSync = Format(Now, "yyyy-mm-ddThh:nn:ss") & "Z"

    Set part = ActiveDocument.CustomXMLParts.Add( _
        "<cache xmlns=""" & CACHE_NAMESPACE & """ lastSync=""" & lastSync & """>" & _
        "<data><![CDATA[" & jsonData & "]]></data>" & _
        "</cache>")

    Exit Sub

ErrorHandler:
    MsgBox "Erreur lors de la sauvegarde du cache: " & Err.Description, vbExclamation
End Sub

' Load vulnerabilities from cache
Public Function LoadCache() As String
    On Error GoTo ErrorHandler

    Dim part As Object
    Dim xml As String
    Dim dataNode As Object

    Set part = GetCachePart()
    If part Is Nothing Then
        LoadCache = ""
        Exit Function
    End If

    xml = part.xml

    ' Extract CDATA content
    Dim startPos As Long
    Dim endPos As Long

    startPos = InStr(xml, "<![CDATA[")
    endPos = InStr(xml, "]]>")

    If startPos > 0 And endPos > startPos Then
        LoadCache = Mid(xml, startPos + 9, endPos - startPos - 9)
    Else
        LoadCache = ""
    End If

    Exit Function

ErrorHandler:
    LoadCache = ""
End Function

' Get last sync timestamp
Public Function GetLastSync() As String
    On Error GoTo ErrorHandler

    Dim part As Object
    Dim xml As String
    Dim startPos As Long
    Dim endPos As Long

    Set part = GetCachePart()
    If part Is Nothing Then
        GetLastSync = ""
        Exit Function
    End If

    xml = part.xml

    ' Extract lastSync attribute
    startPos = InStr(xml, "lastSync=""")
    If startPos > 0 Then
        startPos = startPos + 10
        endPos = InStr(startPos, xml, """")
        GetLastSync = Mid(xml, startPos, endPos - startPos)
    Else
        GetLastSync = ""
    End If

    Exit Function

ErrorHandler:
    GetLastSync = ""
End Function

' Check if cache needs refresh
Public Function NeedsRefresh() As Boolean
    Dim lastSync As String
    Dim lastSyncDate As Date
    Dim hoursSince As Double

    lastSync = GetLastSync()

    If Len(lastSync) = 0 Then
        NeedsRefresh = True
        Exit Function
    End If

    ' Parse ISO date
    On Error Resume Next
    lastSyncDate = CDate(Replace(Replace(lastSync, "T", " "), "Z", ""))
    If Err.Number <> 0 Then
        NeedsRefresh = True
        Exit Function
    End If
    On Error GoTo 0

    ' Calculate hours since last sync
    hoursSince = DateDiff("h", lastSyncDate, Now)

    NeedsRefresh = (hoursSince >= CACHE_MAX_AGE_HOURS)
End Function

' Sync cache with API
Public Sub SyncCache()
    On Error GoTo ErrorHandler

    Dim jsonData As String
    Dim lastSync As String

    ' Show progress
    Application.StatusBar = "Synchronizing vulnerabilities..."

    ' Get last sync for incremental update
    lastSync = GetLastSync()

    ' Fetch from API
    jsonData = GetBulk(lastSync)

    If Len(jsonData) = 0 Then
        MsgBox "Échec de la synchronisation. Vérifiez votre connexion.", vbExclamation
        Application.StatusBar = False
        Exit Sub
    End If

    ' Save to cache
    SaveCache jsonData

    Application.StatusBar = "Synchronization complete!"

    ' Clear status bar after 2 seconds
    Application.OnTime Now + TimeValue("00:00:02"), "ClearStatusBar"

    Exit Sub

ErrorHandler:
    MsgBox "Erreur de synchronisation: " & Err.Description, vbCritical
    Application.StatusBar = False
End Sub

' Helper to clear status bar
Public Sub ClearStatusBar()
    Application.StatusBar = False
End Sub
