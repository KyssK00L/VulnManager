Attribute VB_Name = "Insert"
Option Explicit

' VulnManager Insert Module
' Handles insertion of vulnerability cartouche into document

Private Function HasJsonKey(ByVal data As Object, ByVal key As String) As Boolean
    On Error GoTo Missing

    If TypeName(data) = "Dictionary" Then
        HasJsonKey = data.Exists(key)
    Else
        HasJsonKey = False
    End If

    Exit Function

Missing:
    HasJsonKey = False
End Function

Private Function GetJsonText(ByVal data As Object, ByVal key As String, Optional ByVal defaultValue As String = "") As String
    Dim value As Variant

    On Error GoTo Missing

    If HasJsonKey(data, key) Then
        value = data(key)
        If IsNull(value) Then
            GetJsonText = defaultValue
        Else
            GetJsonText = Trim(CStr(value))
        End If
    Else
        GetJsonText = defaultValue
    End If

    Exit Function

Missing:
    GetJsonText = defaultValue
End Function

Private Function GetCvssScoreText(ByVal vuln As Object) As String
    Dim value As Variant

    On Error GoTo Missing

    If HasJsonKey(vuln, "cvss_score") Then
        value = vuln("cvss_score")
        If IsNull(value) Then GoTo Missing

        If IsNumeric(value) Then
            GetCvssScoreText = Format$(CDbl(value), "0.0#")
        Else
            GetCvssScoreText = Trim(CStr(value))
        End If
    Else
        GetCvssScoreText = ""
    End If

    Exit Function

Missing:
    GetCvssScoreText = ""
End Function

Private Sub ApplyLevelColor(ByVal rng As Range, ByVal level As String)
    Select Case UCase$(level)
        Case "CRITICAL"
            rng.Font.Color = RGB(220, 38, 38)
        Case "HIGH"
            rng.Font.Color = RGB(234, 88, 12)
        Case "MEDIUM"
            rng.Font.Color = RGB(202, 138, 4)
        Case "LOW"
            rng.Font.Color = RGB(37, 99, 235)
        Case Else
            rng.Font.Color = RGB(107, 114, 128)
    End Select
End Sub

Private Sub InsertTitle(ByVal title As String)
    Dim rng As Range
    Set rng = Selection.Range

    With rng
        .Font.Bold = True
        .Font.Size = 14
        .Font.Color = RGB(0, 0, 0)
        .Text = title & vbCrLf
        .Collapse wdCollapseEnd
    End With
End Sub

Private Sub InsertLevelBadge(ByVal level As String)
    Dim rng As Range
    Set rng = Selection.Range

    With rng
        .Font.Bold = True
        .Font.Size = 10
        .Text = "Criticité: " & IIf(Len(level) = 0, "Non renseignée", level) & vbCrLf
        ApplyLevelColor rng, level
        .Collapse wdCollapseEnd
    End With
End Sub

Private Sub InsertMetadataBlock(ByVal protocol As String, ByVal cvssScore As String, _
                                ByVal cvssVector As String, ByVal vulnType As String)
    Dim rng As Range
    Set rng = Selection.Range

    With rng
        .Font.Bold = False
        .Font.Size = 10
        .Font.Color = RGB(107, 114, 128)
        .Text = "Protocole: " & IIf(Len(protocol) = 0, "Non renseigné", protocol) & vbCrLf

        If Len(cvssScore) > 0 Then
            .InsertAfter "CVSS: " & cvssScore & vbCrLf
        End If

        If Len(cvssVector) > 0 Then
            .InsertAfter "Vecteur CVSS: " & cvssVector & vbCrLf
        End If

        If Len(vulnType) > 0 Then
            .InsertAfter "Type: " & vulnType & vbCrLf
        End If

        .InsertAfter vbCrLf
        .Collapse wdCollapseEnd
    End With
End Sub

Private Sub InsertSection(ByVal title As String, ByVal content As String)
    Dim rng As Range

    Set rng = Selection.Range
    With rng
        .Font.Bold = True
        .Font.Size = 11
        .Font.Color = RGB(0, 0, 0)
        .Text = title & vbCrLf
        .Collapse wdCollapseEnd
    End With

    Set rng = Selection.Range
    With rng
        .Font.Bold = False
        .Font.Size = 10
        .Text = IIf(Len(content) = 0, "Non renseigné", content) & vbCrLf & vbCrLf
        .Collapse wdCollapseEnd
    End With
End Sub

' Insert vulnerability at cursor position
Public Sub InsertVulnerability(ByVal vulnId As String)
    On Error GoTo ErrorHandler

    Dim jsonData As String
    Dim vuln As Object

    ' Get vulnerability details from API
    jsonData = GetCardJson(vulnId)

    If Len(jsonData) = 0 Then
        MsgBox "Impossible de récupérer la vulnérabilité.", vbExclamation
        Exit Sub
    End If

    ' Parse JSON (requires VBA-JSON module)
    Set vuln = ParseJson(jsonData)

    If vuln Is Nothing Then
        MsgBox "Réponse JSON invalide reçue depuis l'API VulnManager.", vbCritical
        Exit Sub
    End If

    ' Insert cartouche
    InsertCartouche vuln

    Set vuln = Nothing

    Exit Sub

ErrorHandler:
    MsgBox "Erreur lors de l'insertion: " & Err.Description, vbCritical
End Sub

' Insert formatted cartouche
Private Sub InsertCartouche(ByVal vuln As Object)
    Dim title As String
    Dim level As String
    Dim protocol As String
    Dim cvssScore As String
    Dim cvssVector As String
    Dim vulnType As String
    Dim scopeText As String
    Dim descriptionText As String
    Dim riskText As String
    Dim recommendationText As String

    title = GetJsonText(vuln, "name")

    If Len(title) = 0 Then
        MsgBox "La vulnérabilité retournée ne contient pas de champ 'name'.", vbCritical
        Exit Sub
    End If

    level = GetJsonText(vuln, "level")
    protocol = GetJsonText(vuln, "protocol_interface")
    cvssScore = GetCvssScoreText(vuln)
    cvssVector = GetJsonText(vuln, "cvss_vector")
    vulnType = GetJsonText(vuln, "type")
    scopeText = GetJsonText(vuln, "scope")
    descriptionText = GetJsonText(vuln, "description")
    riskText = GetJsonText(vuln, "risk")
    recommendationText = GetJsonText(vuln, "recommendation")

    InsertTitle title
    InsertLevelBadge level
    InsertMetadataBlock protocol, cvssScore, cvssVector, vulnType
    InsertSection "Périmètre", scopeText
    InsertSection "Description", descriptionText
    InsertSection "Risque", riskText
    InsertSection "Recommandation", recommendationText

    ' Add page break
    Dim rng As Range
    Set rng = Selection.Range
    rng.InsertBreak Type:=wdPageBreak
End Sub
