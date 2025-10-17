Attribute VB_Name = "Insert"
Option Explicit

' VulnManager Insert Module
' Handles insertion of vulnerability cartouche into document

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

    ' Insert cartouche
    InsertCartouche vuln

    Set vuln = Nothing

    Exit Sub

ErrorHandler:
    MsgBox "Erreur lors de l'insertion: " & Err.Description, vbCritical
End Sub

' Insert formatted cartouche
Private Sub InsertCartouche(ByVal vuln As Object)
    Dim rng As Range
    Set rng = Selection.Range

    ' Insert title
    With rng
        .Font.Bold = True
        .Font.Size = 14
        .Font.Color = RGB(0, 0, 0)
        .Text = vuln("name") & vbCrLf
        .Collapse wdCollapseEnd
    End With

    ' Insert level badge
    Set rng = Selection.Range
    With rng
        .Font.Bold = True
        .Font.Size = 10
        .Text = "Criticité: " & vuln("level") & vbCrLf

        ' Color based on level
        Select Case vuln("level")
            Case "Critical"
                .Font.Color = RGB(220, 38, 38)
            Case "High"
                .Font.Color = RGB(234, 88, 12)
            Case "Medium"
                .Font.Color = RGB(202, 138, 4)
            Case "Low"
                .Font.Color = RGB(37, 99, 235)
            Case Else
                .Font.Color = RGB(107, 114, 128)
        End Select

        .Collapse wdCollapseEnd
    End With

    ' Insert metadata
    Set rng = Selection.Range
    With rng
        .Font.Bold = False
        .Font.Size = 10
        .Font.Color = RGB(107, 114, 128)
        .Text = "Protocole: " & vuln("protocol_interface") & vbCrLf

        If Not IsNull(vuln("cvss_score")) Then
            .InsertAfter "CVSS: " & vuln("cvss_score") & vbCrLf
        End If

        .InsertAfter vbCrLf
        .Collapse wdCollapseEnd
    End With

    ' Insert scope
    Set rng = Selection.Range
    With rng
        .Font.Bold = True
        .Font.Size = 11
        .Font.Color = RGB(0, 0, 0)
        .Text = "Périmètre" & vbCrLf
        .Collapse wdCollapseEnd
    End With

    Set rng = Selection.Range
    With rng
        .Font.Bold = False
        .Font.Size = 10
        .Text = vuln("scope") & vbCrLf & vbCrLf
        .Collapse wdCollapseEnd
    End With

    ' Insert description
    Set rng = Selection.Range
    With rng
        .Font.Bold = True
        .Font.Size = 11
        .Font.Color = RGB(0, 0, 0)
        .Text = "Description" & vbCrLf
        .Collapse wdCollapseEnd
    End With

    Set rng = Selection.Range
    With rng
        .Font.Bold = False
        .Font.Size = 10
        .Text = vuln("description") & vbCrLf & vbCrLf
        .Collapse wdCollapseEnd
    End With

    ' Insert risk
    Set rng = Selection.Range
    With rng
        .Font.Bold = True
        .Font.Size = 11
        .Font.Color = RGB(0, 0, 0)
        .Text = "Risque" & vbCrLf
        .Collapse wdCollapseEnd
    End With

    Set rng = Selection.Range
    With rng
        .Font.Bold = False
        .Font.Size = 10
        .Text = vuln("risk") & vbCrLf & vbCrLf
        .Collapse wdCollapseEnd
    End With

    ' Insert recommendation
    Set rng = Selection.Range
    With rng
        .Font.Bold = True
        .Font.Size = 11
        .Font.Color = RGB(0, 0, 0)
        .Text = "Recommandation" & vbCrLf
        .Collapse wdCollapseEnd
    End With

    Set rng = Selection.Range
    With rng
        .Font.Bold = False
        .Font.Size = 10
        .Text = vuln("recommendation") & vbCrLf & vbCrLf
        .Collapse wdCollapseEnd
    End With

    ' Add page break
    Set rng = Selection.Range
    rng.InsertBreak Type:=wdPageBreak
End Sub
